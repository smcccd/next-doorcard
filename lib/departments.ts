// lib/departments.ts
export interface Department {
  code: string;
  name: string;
  searchTerms: string[];
}

export const DEPARTMENTS: Department[] = [
  {
    code: "MATH",
    name: "Mathematics",
    searchTerms: [
      "math",
      "mathematics",
      "algebra",
      "calculus",
      "statistics",
      "stat",
    ],
  },
  {
    code: "CS",
    name: "Computer Science",
    searchTerms: [
      "cs",
      "computer science",
      "programming",
      "software",
      "web development",
      "data structures",
    ],
  },
  {
    code: "ENGL",
    name: "English",
    searchTerms: ["english", "engl", "composition", "literature", "writing"],
  },
  {
    code: "BIO",
    name: "Biology",
    searchTerms: [
      "bio",
      "biology",
      "anatomy",
      "physiology",
      "botany",
      "zoology",
    ],
  },
  {
    code: "CHEM",
    name: "Chemistry",
    searchTerms: ["chem", "chemistry", "organic", "inorganic", "biochemistry"],
  },
  {
    code: "PHYS",
    name: "Physics",
    searchTerms: ["phys", "physics", "engineering physics", "mechanics"],
  },
  {
    code: "PSYC",
    name: "Psychology",
    searchTerms: ["psyc", "psychology", "psych", "behavioral", "cognitive"],
  },
  {
    code: "BUS",
    name: "Business",
    searchTerms: [
      "bus",
      "business",
      "accounting",
      "marketing",
      "management",
      "finance",
    ],
  },
  {
    code: "HIST",
    name: "History",
    searchTerms: ["hist", "history", "historical"],
  },
  {
    code: "ART",
    name: "Art",
    searchTerms: ["art", "arts", "drawing", "painting", "sculpture", "design"],
  },
  {
    code: "MUS",
    name: "Music",
    searchTerms: ["mus", "music", "band", "choir", "orchestra", "piano"],
  },
  {
    code: "PE",
    name: "Physical Education",
    searchTerms: [
      "pe",
      "physical education",
      "kinesiology",
      "fitness",
      "sports",
    ],
  },
  {
    code: "NURS",
    name: "Nursing",
    searchTerms: ["nurs", "nursing", "medical", "healthcare"],
  },
  {
    code: "ECON",
    name: "Economics",
    searchTerms: ["econ", "economics", "microeconomics", "macroeconomics"],
  },
  {
    code: "SOC",
    name: "Sociology",
    searchTerms: ["soc", "sociology", "social", "anthropology"],
  },
  {
    code: "PHIL",
    name: "Philosophy",
    searchTerms: ["phil", "philosophy", "ethics", "logic"],
  },
  {
    code: "POLI",
    name: "Political Science",
    searchTerms: ["poli", "political science", "government", "civics"],
  },
  {
    code: "SPAN",
    name: "Spanish",
    searchTerms: ["span", "spanish", "espanol"],
  },
  { code: "FREN", name: "French", searchTerms: ["fren", "french", "francais"] },
  {
    code: "GEOL",
    name: "Geology",
    searchTerms: ["geol", "geology", "earth science", "environmental"],
  },
];

export function extractDepartmentFromText(text: string): string | null {
  if (!text) return null;

  const lowerText = text.toLowerCase();

  // Look for department matches in the text
  for (const dept of DEPARTMENTS) {
    // Check if any search terms match
    for (const term of dept.searchTerms) {
      if (lowerText.includes(term)) {
        return dept.code;
      }
    }

    // Also check for course code patterns like "CS 110", "MATH 200"
    const coursePattern = new RegExp(
      `\\b${dept.code.toLowerCase()}\\s*\\d+`,
      "i"
    );
    if (coursePattern.test(text)) {
      return dept.code;
    }
  }

  return null;
}

export function getDepartmentName(code: string): string {
  const dept = DEPARTMENTS.find((d) => d.code === code);
  return dept ? dept.name : code;
}

export function getAllDepartments(): Department[] {
  return DEPARTMENTS;
}
