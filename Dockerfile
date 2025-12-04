# Dockerfile — python 3.11, OpenBLAS, install numpy first, then test numpy
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

WORKDIR /app

# Install system libs (OpenBLAS/LAPACK + build tools)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      build-essential \
      gcc \
      libopenblas-dev \
      liblapack-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements for caching
COPY requirements.txt .

# Upgrade pip/setuptools/wheel and install numpy first
RUN python -m pip install --upgrade pip setuptools wheel
RUN pip install --no-cache-dir numpy==1.25.0

# --- Sanity check: fail fast if numpy._core can't be imported ---
RUN python - <<'PYTEST'
import sys
try:
    import numpy
    print("NUMPY OK:", numpy.__version__, "path:", getattr(numpy, '__file__', None))
    import importlib
    core = importlib.import_module("numpy._core")
    print("NUMPY._CORE OK: ", getattr(core, '__file__', None))
except Exception as e:
    print("NUMPY IMPORT ERROR:", repr(e))
    sys.exit(10)
PYTEST
# ---------------------------------------------------------------

# Install all other requirements (numpy already present)
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Expose and run
EXPOSE 8000
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:app"]
