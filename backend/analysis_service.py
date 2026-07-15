from pathlib import Path
from typing import BinaryIO, TextIO

import pandas as pd


CsvSource = str | Path | BinaryIO | TextIO

NUMERIC_COLUMNS = [
    "Protein(g)",
    "Carbs(g)",
    "Fat(g)",
]

REQUIRED_COLUMNS = {
    "Diet_type",
    "Recipe_name",
    "Cuisine_type",
    *NUMERIC_COLUMNS,
}


class InvalidDietFilterError(ValueError):
    """Raised when an unsupported diet filter is requested."""


def analyze_dataset(
    source: CsvSource,
    diet_type: str | None = None,
) -> dict:
    """
    Read and analyze the Diets Dataset.

    `source` can be a local file path or an in-memory CSV stream downloaded
    from Azure Blob Storage.
    """
    dataframe = pd.read_csv(source)

    missing_columns = REQUIRED_COLUMNS.difference(dataframe.columns)

    if missing_columns:
        missing_list = ", ".join(sorted(missing_columns))
        raise ValueError(f"Dataset is missing required columns: {missing_list}")

    dataframe = dataframe.copy()

    for column in NUMERIC_COLUMNS:
        dataframe[column] = pd.to_numeric(
            dataframe[column],
            errors="coerce",
        )

    dataframe[NUMERIC_COLUMNS] = dataframe[NUMERIC_COLUMNS].fillna(
        dataframe[NUMERIC_COLUMNS].mean()
    )

    if dataframe[NUMERIC_COLUMNS].isna().any().any():
        raise ValueError("Dataset contains unusable nutritional values.")

    available_diets = sorted(
        dataframe["Diet_type"]
        .dropna()
        .astype(str)
        .str.strip()
        .str.lower()
        .unique()
        .tolist()
    )

    selected_diet = None

    if diet_type:
        selected_diet = diet_type.strip().lower()

        if selected_diet not in available_diets:
            allowed = ", ".join(available_diets)

            raise InvalidDietFilterError(
                f"Unsupported diet '{diet_type}'. "
                f"Allowed diets: {allowed}."
            )

        dataframe = dataframe[
            dataframe["Diet_type"]
            .astype(str)
            .str.strip()
            .str.lower()
            == selected_diet
        ].copy()

    average_macros = (
        dataframe.groupby("Diet_type", as_index=False)[NUMERIC_COLUMNS]
        .mean()
        .rename(
            columns={
                "Diet_type": "dietType",
                "Protein(g)": "averageProtein",
                "Carbs(g)": "averageCarbs",
                "Fat(g)": "averageFat",
            }
        )
        .sort_values("dietType")
        .round(2)
    )

    recipe_counts = (
        dataframe.groupby("Diet_type", as_index=False)
        .size()
        .rename(
            columns={
                "Diet_type": "dietType",
                "size": "recipeCount",
            }
        )
        .sort_values("dietType")
    )

    cuisine_comparison = (
        dataframe.groupby("Cuisine_type", as_index=False)
        .agg(
            averageProtein=("Protein(g)", "mean"),
            averageCarbs=("Carbs(g)", "mean"),
            recipeCount=("Recipe_name", "count"),
        )
        .rename(columns={"Cuisine_type": "cuisineType"})
        .sort_values("recipeCount", ascending=False)
        .round(
            {
                "averageProtein": 2,
                "averageCarbs": 2,
            }
        )
    )

    return {
        "charts": {
            "averageMacrosByDiet": average_macros.to_dict(
                orient="records"
            ),
            "recipeCountByDiet": recipe_counts.to_dict(
                orient="records"
            ),
            "cuisineMacroComparison": cuisine_comparison.to_dict(
                orient="records"
            ),
        },
        "datasetMetadata": {
            "recordCount": int(len(dataframe)),
            "dietTypeCount": int(dataframe["Diet_type"].nunique()),
            "cuisineCount": int(dataframe["Cuisine_type"].nunique()),
            "selectedDiet": selected_diet or "all",
            "availableDietTypes": available_diets,
        },
    }
