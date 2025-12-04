# Dockerfile (robust, Python 3.11)
FROM python:3.11-slim

# Avoid creating .pyc files and make logs unbuffered
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

WORKDIR /app

# Install small set of system deps (OpenBLAS + lapack for numpy/scipy),
# plus build-essential/gcc so pip can build anything if needed.
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      build-essential \
      gcc \
      libopenblas-dev \
      liblapack-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY requirements.txt .

# Upgrade pip/setuptools/wheel, install numpy wheel first (ensures compiled pieces),
# then install the rest of the requirements.
RUN python -m pip install --upgrade pip setuptools wheel
RUN pip install --no-cache-dir numpy==1.25.0
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose port (Render maps the external port automatically)
EXPOSE 8000

# Use gunicorn to serve the Flask app: app:app (adjust if your app object is different)
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:app"]
