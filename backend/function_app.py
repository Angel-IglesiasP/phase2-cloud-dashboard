import datetime
import json
import logging
import time

import azure.functions as func

from analysis_service import InvalidDietFilterError, analyze_dataset
from storage_service import (
    DatasetBlobNotFoundError,
    StorageConfigurationError,
    download_dataset_csv,
)


app = func.FunctionApp()


@app.route(
    route="diet-analysis",
    methods=["GET"],
    auth_level=func.AuthLevel.ANONYMOUS,
)
def diet_analysis(req: func.HttpRequest) -> func.HttpResponse:
    start_time = time.perf_counter()

    logging.info("Diet analysis endpoint received a request.")

    try:
        diet_filter = req.params.get("diet")
        dataset_stream = download_dataset_csv()

        analysis_result = analyze_dataset(
            dataset_stream,
            diet_type=diet_filter,
        )

        execution_time_ms = round(
            (time.perf_counter() - start_time) * 1000,
            2,
        )

        response_data = {
            "status": "success",
            "charts": analysis_result["charts"],
            "metadata": {
                **analysis_result["datasetMetadata"],
                "executionTimeMs": execution_time_ms,
                "generatedAt": datetime.datetime.now(
                    datetime.timezone.utc
                ).isoformat(),
                "source": "azure-blob-storage",
            },
        }

        return func.HttpResponse(
            body=json.dumps(response_data),
            status_code=200,
            mimetype="application/json",
        )

    except InvalidDietFilterError as error:
        logging.warning("Invalid diet filter: %s", error)

        return func.HttpResponse(
            body=json.dumps(
                {
                    "status": "error",
                    "message": str(error),
                }
            ),
            status_code=400,
            mimetype="application/json",
        )

    except StorageConfigurationError:
        logging.exception("Dataset storage is not configured.")

        return func.HttpResponse(
            body=json.dumps(
                {
                    "status": "error",
                    "message": "Dataset storage is not configured.",
                }
            ),
            status_code=500,
            mimetype="application/json",
        )

    except DatasetBlobNotFoundError:
        logging.exception("The Diets Dataset blob could not be found.")

        return func.HttpResponse(
            body=json.dumps(
                {
                    "status": "error",
                    "message": "The Diets Dataset blob could not be found.",
                }
            ),
            status_code=500,
            mimetype="application/json",
        )

    except FileNotFoundError:
        logging.exception("The Diets Dataset could not be found.")

        return func.HttpResponse(
            body=json.dumps(
                {
                    "status": "error",
                    "message": "The Diets Dataset could not be found.",
                }
            ),
            status_code=500,
            mimetype="application/json",
        )

    except ValueError as error:
        logging.exception("The Diets Dataset is invalid.")

        return func.HttpResponse(
            body=json.dumps(
                {
                    "status": "error",
                    "message": str(error),
                }
            ),
            status_code=500,
            mimetype="application/json",
        )

    except Exception:
        logging.exception("Unexpected diet analysis failure.")

        return func.HttpResponse(
            body=json.dumps(
                {
                    "status": "error",
                    "message": "An unexpected server error occurred.",
                }
            ),
            status_code=500,
            mimetype="application/json",
        )
