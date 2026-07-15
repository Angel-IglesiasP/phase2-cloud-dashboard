import io
import os

from azure.core.exceptions import ResourceNotFoundError
from azure.storage.blob import BlobServiceClient


CONNECTION_STRING_SETTING = "DIET_STORAGE_CONNECTION_STRING"
CONTAINER_SETTING = "DIET_STORAGE_CONTAINER"
BLOB_SETTING = "DIET_STORAGE_BLOB"

DEFAULT_CONTAINER = "datasets"
DEFAULT_BLOB = "All_Diets.csv"


class StorageConfigurationError(RuntimeError):
    """Raised when the dataset storage configuration is incomplete."""


class DatasetBlobNotFoundError(FileNotFoundError):
    """Raised when the configured dataset blob does not exist."""


def download_dataset_csv() -> io.BytesIO:
    """Download the configured CSV blob and return it as an in-memory stream."""
    connection_string = os.getenv(CONNECTION_STRING_SETTING)

    if not connection_string:
        raise StorageConfigurationError(
            f"Missing required setting: {CONNECTION_STRING_SETTING}."
        )

    container_name = os.getenv(CONTAINER_SETTING, DEFAULT_CONTAINER)
    blob_name = os.getenv(BLOB_SETTING, DEFAULT_BLOB)

    service_client = BlobServiceClient.from_connection_string(
        connection_string
    )
    blob_client = service_client.get_blob_client(
        container=container_name,
        blob=blob_name,
    )

    try:
        csv_bytes = blob_client.download_blob().readall()
    except ResourceNotFoundError as error:
        raise DatasetBlobNotFoundError(
            f"Dataset blob '{container_name}/{blob_name}' was not found."
        ) from error

    if not csv_bytes:
        raise ValueError(
            f"Dataset blob '{container_name}/{blob_name}' is empty."
        )

    return io.BytesIO(csv_bytes)
