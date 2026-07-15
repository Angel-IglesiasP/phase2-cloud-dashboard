const API_URL = String(process.env.NEXT_PUBLIC_API_URL);

export type MacroByDiet = {
  dietType: string;
  averageProtein: number;
  averageCarbs: number;
  averageFat: number;
};

export type RecipeCountByDiet = {
  dietType: string;
  recipeCount: number;
};

export type CuisineMacroComparison = {
  cuisineType: string;
  averageProtein: number;
  averageCarbs: number;
  recipeCount: number;
};

export type DietAnalysisResponse = {
  status: "success";
  charts: {
    averageMacrosByDiet: MacroByDiet[];
    recipeCountByDiet: RecipeCountByDiet[];
    cuisineMacroComparison: CuisineMacroComparison[];
  };
  metadata: {
    recordCount: number;
    dietTypeCount: number;
    cuisineCount: number;
    selectedDiet: string;
    availableDietTypes: string[];
    executionTimeMs: number;
    generatedAt: string;
    source: string;
  };
};

export type DietAnalysisError = {
  status: "error";
  message: string;
};

export async function getDietAnalysis(
  diet: string = "all",
): Promise<DietAnalysisResponse> {
  const url = new URL(API_URL);

  if (diet !== "all") {
    url.searchParams.set("diet", diet);
  }

  const response = await fetch(url);
  const body = await response.json();

  if (!response.ok) {
    throw new Error(
      (body as DietAnalysisError).message || "Diet analysis request failed.",
    );
  }

  return body as DietAnalysisResponse;
}
