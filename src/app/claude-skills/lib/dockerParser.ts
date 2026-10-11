/**
 * Client-Side Docker Compose & Dockerfile Introspector
 * 100% Client-Side execution (ADR-001) - Zero Server Transmission.
 * Extracts services, ports, container names, networks, and environment variables
 * to synthesize Container-Aware Pair Programmer rules and MCP Docker configs.
 */

export interface DockerService {
  name: string;
  image?: string;
  buildPath?: string;
  ports: string[];
  volumes: string[];
  dependsOn: string[];
  environmentKeys: string[];
  command?: string;
}

export interface ParsedDockerCompose {
  services: DockerService[];
  totalServices: number;
  exposedPorts: string[];
  detectedVolumes: string[];
  synthesizedDirectives: string[];
  synthesizedProcedures: string[];
  synthesizedRole: string;
  suggestedTitle: string;
}

/**
 * Parses docker-compose.yml / compose.yaml or Dockerfile text
 */
export function inspectDockerCompose(input: string): ParsedDockerCompose {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Empty Docker configuration provided.");
  }

  // Detect if Dockerfile or Compose YAML
  const isDockerfile =
    (trimmed.startsWith("FROM ") || trimmed.includes("\nFROM ")) &&
    !trimmed.includes("services:");

  if (isDockerfile) {
    return parseDockerfile(trimmed);
  }

  return parseComposeYaml(trimmed);
}

type ComposeListKey = "ports" | "volumes" | "depends_on" | "environment";

/**
 * Lightweight client-side YAML parser for docker-compose services
 */
function parseComposeYaml(input: string): ParsedDockerCompose {
  const lines = input.split("\n");
  const services: DockerService[] = [];
  const allExposedPorts: string[] = [];
  const allVolumes: string[] = [];

  let inServicesBlock = false;
  let currentService: Partial<DockerService> | null = null;
  let currentArrayKey: ComposeListKey | null = null;
  let baseIndent = 0;
  // Indent of service names, fixed by the first service; deeper "key:" lines (ports:, depends_on:) are properties
  let serviceIndent = -1;

  const addItem = (service: Partial<DockerService>, key: ComposeListKey, rawValue: string) => {
    const itemVal = rawValue.trim().replace(/['"]/g, "");
    if (!itemVal) return;
    if (key === "ports") {
      service.ports?.push(itemVal);
      allExposedPorts.push(itemVal);
    } else if (key === "volumes") {
      service.volumes?.push(itemVal);
    } else if (key === "depends_on") {
      service.dependsOn?.push(itemVal);
    } else {
      const envKey = itemVal.split("=")[0].trim();
      if (envKey) service.environmentKeys?.push(envKey);
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    // Strip comments
    const lineWithoutComment = rawLine.replace(/#.*$/, "");
    if (!lineWithoutComment.trim()) continue;

    const indent = rawLine.search(/\S/);
    const trimmed = lineWithoutComment.trim();

    // Check top-level 'services:' block
    if (trimmed.startsWith("services:")) {
      inServicesBlock = true;
      baseIndent = indent;
      serviceIndent = -1;
      continue;
    }

    // Top-level block ending (e.g. volumes:, networks:)
    if (inServicesBlock && indent <= baseIndent && /^[a-zA-Z0-9_-]+:/.test(trimmed)) {
      if (currentService && currentService.name) {
        services.push(finalizeService(currentService));
        currentService = null;
      }
      if (!trimmed.startsWith("services:")) {
        inServicesBlock = false;
        // Check top-level volumes
        if (trimmed.startsWith("volumes:")) {
          // Collect remaining named volumes
          for (let j = i + 1; j < lines.length; j++) {
            const vLine = lines[j].replace(/#.*$/, "").trim();
            if (vLine.endsWith(":") && !vLine.startsWith("-")) {
              allVolumes.push(vLine.replace(":", ""));
            }
          }
        }
        continue;
      }
    }

    if (inServicesBlock) {
      // A new service declaration sits at the same indent as the first service
      const serviceMatch = trimmed.match(/^([a-zA-Z0-9_.-]+):$/);
      if (serviceMatch && (serviceIndent === -1 ? indent > baseIndent : indent === serviceIndent)) {
        serviceIndent = indent;
        if (currentService && currentService.name) {
          services.push(finalizeService(currentService));
        }
        currentService = {
          name: serviceMatch[1],
          ports: [],
          volumes: [],
          dependsOn: [],
          environmentKeys: [],
        };
        currentArrayKey = null;
        continue;
      }

      if (!currentService) continue;

      // Check service properties
      if (trimmed.startsWith("image:")) {
        currentService.image = trimmed.replace("image:", "").trim().replace(/['"]/g, "");
        currentArrayKey = null;
      } else if (trimmed.startsWith("build:")) {
        currentService.buildPath = trimmed.replace("build:", "").trim().replace(/['"]/g, "") || ".";
        currentArrayKey = null;
      } else if (trimmed.startsWith("command:")) {
        currentService.command = trimmed.replace("command:", "").trim().replace(/['"]/g, "");
        currentArrayKey = null;
      } else if (/^(ports|volumes|depends_on|environment):/.test(trimmed)) {
        const key = trimmed.slice(0, trimmed.indexOf(":")) as ComposeListKey;
        // Flow-style list on the same line: ports: ["3000:3000"]
        const inline = trimmed.match(/^[a-z_]+:\s*\[(.*)\]\s*$/);
        if (inline) {
          for (const item of inline[1].split(",")) addItem(currentService, key, item);
          currentArrayKey = null;
        } else {
          currentArrayKey = key;
        }
      } else if (trimmed.startsWith("- ") && currentArrayKey) {
        addItem(currentService, currentArrayKey, trimmed.slice(2));
      } else if (currentArrayKey === "environment" && trimmed.includes(":") && !trimmed.endsWith(":")) {
        // Dictionary-style environment: KEY: value
        const envKey = trimmed.split(":")[0].trim();
        if (envKey) currentService.environmentKeys?.push(envKey);
      }
    }
  }

  // Push last service
  if (currentService && currentService.name) {
    services.push(finalizeService(currentService));
  }

  // Fallback if no services detected
  if (services.length === 0) {
    throw new Error("No Docker Compose services found. Ensure input includes a 'services:' block.");
  }

  return synthesizeDockerMetadata(services, allExposedPorts, allVolumes);
}

function finalizeService(s: Partial<DockerService>): DockerService {
  return {
    name: s.name || "unknown",
    image: s.image,
    buildPath: s.buildPath,
    ports: s.ports || [],
    volumes: s.volumes || [],
    dependsOn: s.dependsOn || [],
    environmentKeys: s.environmentKeys || [],
    command: s.command,
  };
}

/**
 * Parses single Dockerfile
 */
function parseDockerfile(input: string): ParsedDockerCompose {
  const lines = input.split("\n");
  let fromImage = "node:alpine";
  const ports: string[] = [];
  const envKeys: string[] = [];
  let cmd = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("FROM ")) {
      fromImage = trimmed.replace("FROM ", "").trim();
    } else if (trimmed.startsWith("EXPOSE ")) {
      ports.push(trimmed.replace("EXPOSE ", "").trim());
    } else if (trimmed.startsWith("ENV ")) {
      const parts = trimmed.replace("ENV ", "").trim().split(/[=\s]+/);
      if (parts[0]) envKeys.push(parts[0]);
    } else if (trimmed.startsWith("CMD ") || trimmed.startsWith("ENTRYPOINT ")) {
      cmd = trimmed;
    }
  }

  const service: DockerService = {
    name: "app",
    image: fromImage,
    ports,
    volumes: [],
    dependsOn: [],
    environmentKeys: envKeys,
    command: cmd,
  };

  return synthesizeDockerMetadata([service], ports, []);
}

function synthesizeDockerMetadata(
  services: DockerService[],
  exposedPorts: string[],
  volumes: string[]
): ParsedDockerCompose {
  const serviceNames = services.map((s) => s.name);
  const primaryService = services.find((s) => s.name === "web" || s.name === "app" || s.name === "api") || services[0];
  const dbService = services.find((s) =>
    ["db", "postgres", "mysql", "database", "mongo", "redis"].includes(s.name.toLowerCase())
  );

  const synthesizedDirectives: string[] = [
    `Orchestrate multi-service workflow via Docker Compose with services: ${serviceNames.join(", ")}`,
  ];

  if (primaryService) {
    synthesizedDirectives.push(
      `Execute application scripts and test suites inside container: \`docker compose exec ${primaryService.name} npm test\` (or container equivalent)`
    );
  }

  if (dbService) {
    synthesizedDirectives.push(
      `Target internal service name \`${dbService.name}\` for inter-container communication rather than host \`localhost\``
    );
    synthesizedDirectives.push(
      `Never run destructive database operations without containerized migration context`
    );
  }

  if (exposedPorts.length > 0) {
    synthesizedDirectives.push(
      `Preserve exposed service port mapping (${exposedPorts.slice(0, 3).join(", ")}) during local dev container boot`
    );
  }

  const synthesizedProcedures: string[] = [
    "1. Start multi-container stack in detached mode: `docker compose up -d`",
    `2. Stream container logs: \`docker compose logs -f ${primaryService?.name || ""}\``,
    `3. Run interactive shell inside app container: \`docker compose exec ${primaryService?.name || "app"} sh\``,
    "4. Tear down containers and networks: `docker compose down`",
  ];

  const suggestedTitle = `${serviceNames.map((s) => s.toUpperCase()).join(" + ")} Container Stack`;
  const synthesizedRole = `Senior DevOps & Container Orchestration Architect specializing in Dockerized ${serviceNames.join(", ")} architecture`;

  return {
    services,
    totalServices: services.length,
    exposedPorts: Array.from(new Set(exposedPorts)),
    detectedVolumes: Array.from(new Set(volumes)),
    synthesizedDirectives,
    synthesizedProcedures,
    synthesizedRole,
    suggestedTitle,
  };
}
