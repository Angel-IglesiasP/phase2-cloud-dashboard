# Diet Dashboard API Handoff

## Production endpoint

```text
GET https://dietdash-api-cc260715-eucgfbbzcrcecphu.canadacentral-01.azurewebsites.net/api/diet-analysis
```

The endpoint is public and does not require a Function key.

## Optional diet filter

Add the `diet` query parameter to analyze one diet category:

```text
GET /api/diet-analysis?diet=vegan
```

Valid values are:

- `dash`
- `keto`
- `mediterranean`
- `paleo`
- `vegan`

Filter matching is case-insensitive. For example, `KETO` is normalized to
`keto`.

## Frontend request example

```javascript
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
```

A refresh button can call `getDietAnalysis()` again. A diet selector can pass
the selected diet value.

## Successful response

```json
{
  "status": "success",
  "charts": {
    "averageMacrosByDiet": [
      {
        "dietType": "vegan",
        "averageProtein": 56.16,
        "averageCarbs": 254.0,
        "averageFat": 103.3
      }
    ],
    "recipeCountByDiet": [
      {
        "dietType": "vegan",
        "recipeCount": 1522
      }
    ],
    "cuisineMacroComparison": [
      {
        "cuisineType": "american",
        "averageProtein": 53.75,
        "averageCarbs": 267.73,
        "recipeCount": 925
      }
    ]
  },
  "metadata": {
    "recordCount": 1522,
    "dietTypeCount": 1,
    "cuisineCount": 18,
    "selectedDiet": "vegan",
    "availableDietTypes": [
      "dash",
      "keto",
      "mediterranean",
      "paleo",
      "vegan"
    ],
    "executionTimeMs": 30.0,
    "generatedAt": "2026-07-15T03:00:00+00:00",
    "source": "azure-blob-storage"
  }
}
```

The example abbreviates the arrays. The live response includes all applicable
diet and cuisine records.

## Recommended chart mappings

### Grouped bar chart

Use `charts.averageMacrosByDiet`:

- Category: `dietType`
- Series: `averageProtein`, `averageCarbs`, and `averageFat`
- Unit: grams

### Pie or doughnut chart

Use `charts.recipeCountByDiet`:

- Label: `dietType`
- Value: `recipeCount`

### Scatter or bubble chart

Use `charts.cuisineMacroComparison`:

- Label: `cuisineType`
- X-axis: `averageCarbs`
- Y-axis: `averageProtein`
- Bubble size: `recipeCount`

## Error response

An unsupported diet returns HTTP `400`:

```json
{
  "status": "error",
  "message": "Unsupported diet 'carnivore'. Allowed diets: dash, keto, mediterranean, paleo, vegan."
}
```

Storage or server failures return HTTP `500` with a JSON error response.

## CORS

The Function App currently allows these development origins:

- `http://localhost:3000`
- `http://localhost:5173`

After the frontend is deployed, add its exact origin to the Function App's
Azure CORS settings. Do not replace the list with `*`.

## Backend resources

- Resource group: `diet-analysis-rg`
- Function App: `dietdash-api-cc260715`
- Storage Account: `dietdashcc260715`
- Private container: `datasets`
- Dataset blob: `All_Diets.csv`
- Region: Canada Central
- Runtime: Python 3.13 on Flex Consumption
