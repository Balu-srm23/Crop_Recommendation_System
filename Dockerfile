# Dockerfile — debug numpy._core missing
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
WORKDIR /app

# install system libs needed for numeric libs
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      build-essential \
      gcc \
      libopenblas-dev \
      liblapack-dev \
    && rm -rf /var/lib/apt/lists/*

# copy requirements for layer caching
COPY requirements.txt .

# upgrade tooling
RUN python -m pip install --upgrade pip setuptools wheel

# force reinstall numpy (no cache) to avoid partial installs
RUN pip install --no-cache-dir --force-reinstall numpy==1.25.0

# debug: show files and attempt import (will fail the build with clear output if still broken)
RUN python - <<'PYDBG'
import sys, os, importlib, importlib.util, traceback
try:
    import numpy
    np_pkg = os.path.dirname(numpy.__file__)
    print("NUMPY VERSION:", numpy.__version__)
    print("NUMPY __file__:", numpy.__file__)
    print("NUMPY package dir:", np_pkg)
    print("LISTING top-level numpy files:")
    for p in sorted(os.listdir(np_pkg)):
        print("  ", p)
    core_dir = os.path.join(np_pkg, "core")
    print("\nEXISTS numpy/core?", os.path.isdir(core_dir))
    if os.path.isdir(core_dir):
        print("LISTING numpy/core (first 200 entries):")
        for root, dirs, files in os.walk(core_dir):
            rel = os.path.relpath(root, np_pkg)
            print("---", rel, "---")
            for f in files[:200]:
                print("   ", f)
    spec = importlib.util.find_spec("numpy._core")
    print("\nimportlib.util.find_spec('numpy._core') ->", spec)
    print("\nTRY IMPORT numpy._core ...")
    import numpy._core as nc
    print("IMPORT OK:", getattr(nc, '__file__', None))
except Exception:
    print("\nEXCEPTION DURING NUMPY DEBUG:")
    traceback.print_exc()
    sys.exit(11)
PYDBG

# install the rest of requirements
RUN pip install --no-cache-dir -r requirements.txt

# copy app
COPY . .

EXPOSE 8000
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:app"]
