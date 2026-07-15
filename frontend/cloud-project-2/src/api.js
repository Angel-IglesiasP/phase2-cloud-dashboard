const API_URL =
  "https://dietdash-api-cc260715-eucgfbbzcrcecphu.canadacentral-01.azurewebsites.net/api/diet-analysis";

export async function getDietAnalysis(diet = "all") {
  const url = new URL(API_URL);

  if (diet !== "all") {
    url.searchParams.set("diet", diet);
  }

  const response = await fetch(url);
  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.message || "Diet analysis request failed.");
  }

  return body;
}
