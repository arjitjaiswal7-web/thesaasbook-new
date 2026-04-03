export type RobotsRuleType = "allow" | "disallow";

export type RobotsRule = {
  type: RobotsRuleType;
  value: string;
  line: number;
  raw: string;
  specificity: number;
};

export type RobotsGroup = {
  userAgents: string[];
  rules: RobotsRule[];
  startLine: number;
};

export type ParsedRobotsTxt = {
  groups: RobotsGroup[];
  sitemaps: string[];
  warnings: string[];
  raw: string;
};

export type RobotsEvaluation = {
  allowed: boolean;
  matchedRule: RobotsRule | null;
  selectedGroups: RobotsGroup[];
  testedPath: string;
};

function stripComment(line: string) {
  const index = line.indexOf("#");

  if (index === -1) {
    return line;
  }

  return line.slice(0, index);
}

function getRuleSpecificity(value: string) {
  return value.replace(/\*/g, "").replace(/\$/g, "").length;
}

function normalizeUserAgent(value: string) {
  return value.trim().toLowerCase();
}

function userAgentMatches(token: string, userAgent: string) {
  if (token === "*") {
    return true;
  }

  return userAgent.includes(token);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ruleMatchesPath(rule: string, targetPath: string) {
  if (rule === "") {
    return true;
  }

  const anchored = rule.endsWith("$");
  const source = anchored ? rule.slice(0, -1) : rule;
  const pattern = `^${escapeRegExp(source).replace(/\\\*/g, ".*")}${anchored ? "$" : ""}`;

  return new RegExp(pattern).test(targetPath);
}

function chooseBestRule(rules: RobotsRule[]) {
  if (!rules.length) {
    return null;
  }

  return rules.reduce((best, current) => {
    if (!best) {
      return current;
    }

    if (current.specificity > best.specificity) {
      return current;
    }

    if (current.specificity === best.specificity && current.type === "allow") {
      return current;
    }

    return best;
  }, null as RobotsRule | null);
}

export function parseRobotsTxt(content: string): ParsedRobotsTxt {
  const lines = content.split(/\r?\n/);
  const groups: RobotsGroup[] = [];
  const sitemaps: string[] = [];
  const warnings: string[] = [];
  let currentGroup: RobotsGroup | null = null;
  let groupHasRules = false;

  lines.forEach((line, index) => {
    const cleaned = stripComment(line).trim();

    if (!cleaned) {
      return;
    }

    const separatorIndex = cleaned.indexOf(":");

    if (separatorIndex === -1) {
      warnings.push(`Line ${index + 1}: ignored invalid directive.`);
      return;
    }

    const field = cleaned.slice(0, separatorIndex).trim().toLowerCase();
    const value = cleaned.slice(separatorIndex + 1).trim();

    if (field === "sitemap") {
      if (value) {
        sitemaps.push(value);
      }
      return;
    }

    if (field === "user-agent") {
      if (!currentGroup || groupHasRules) {
        currentGroup = {
          userAgents: [],
          rules: [],
          startLine: index + 1,
        };
        groups.push(currentGroup);
        groupHasRules = false;
      }

      currentGroup.userAgents.push(normalizeUserAgent(value));
      return;
    }

    if (field === "allow" || field === "disallow") {
      if (!currentGroup || currentGroup.userAgents.length === 0) {
        warnings.push(`Line ${index + 1}: ${field} ignored because no user-agent group is active.`);
        return;
      }

      currentGroup.rules.push({
        type: field,
        value,
        line: index + 1,
        raw: cleaned,
        specificity: getRuleSpecificity(value),
      });
      groupHasRules = true;
    }
  });

  return {
    groups,
    sitemaps: Array.from(new Set(sitemaps)),
    warnings,
    raw: content,
  };
}

export function pathWithQuery(url: URL) {
  return `${url.pathname}${url.search}` || "/";
}

export function evaluateRobots(parsed: ParsedRobotsTxt, targetPath: string, userAgent: string): RobotsEvaluation {
  const normalizedUserAgent = normalizeUserAgent(userAgent);
  let highestSpecificity = -1;
  const matchingGroups: RobotsGroup[] = [];

  parsed.groups.forEach((group) => {
    const matchingTokens = group.userAgents.filter((token) => userAgentMatches(token, normalizedUserAgent));

    if (!matchingTokens.length) {
      return;
    }

    const specificity = Math.max(
      ...matchingTokens.map((token) => (token === "*" ? 0 : token.length)),
    );

    if (specificity > highestSpecificity) {
      highestSpecificity = specificity;
      matchingGroups.length = 0;
      matchingGroups.push(group);
      return;
    }

    if (specificity === highestSpecificity) {
      matchingGroups.push(group);
    }
  });

  const applicableGroups = highestSpecificity >= 0 ? matchingGroups : [];
  const applicableRules = applicableGroups.flatMap((group) => group.rules);
  const matchingRules = applicableRules.filter((rule) => ruleMatchesPath(rule.value, targetPath));
  const bestRule = chooseBestRule(
    matchingRules.filter((rule) => rule.type === "allow" || (rule.type === "disallow" && rule.value !== "")),
  );

  if (!bestRule) {
    return {
      allowed: true,
      matchedRule: null,
      selectedGroups: applicableGroups,
      testedPath: targetPath,
    };
  }

  return {
    allowed: bestRule.type === "allow",
    matchedRule: bestRule,
    selectedGroups: applicableGroups,
    testedPath: targetPath,
  };
}
