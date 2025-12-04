# Dockerfile — corrected numpy sanity check
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
WORKDIR /app

# system deps for numeric libs
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      build-essential \
      gcc \
      libopenblas-dev \
      liblapack-dev \
    && rm -rf /var/lib/apt/lists/*

# copy requirements for caching
COPY requirements.txt .

# upgrade pip/tools
RUN python -m pip install --upgrade pip setuptools wheel

# reinstall numpy to be sure
RUN pip install --no-cache-dir --force-reinstall numpy==1.25.0

# CORRECTED SANITY CHECK: check numpy, numpy.core, and the compiled ufunc module
RUN python - <<'PYDBG'
import sys, os, importlib, importlib.util, traceback
try:
    import numpy
    print("NUMPY VERSION:", numpy.__version__)
    print("NUMPY __file__:", getattr(numpy, '__file__', None))
    np_pkg = os.path.dirname(numpy.__file__) if getattr(numpy, '__file__', None) else None
    print("NUMPY package dir:", np_pkg)
    if np_pkg and os.path.isdir(np_pkg):
        print("Top-level numpy entries:", sorted(os.listdir(np_pkg)))
        core_dir = os.path.join(np_pkg, "core")
        print("EXISTS numpy/core?", os.path.isdir(core_dir))
        if os.path.isdir(core_dir):
            # show a few compiled extension filenames
            exts = [f for f in os.listdir(core_dir) if f.endswith('.so') or f.endswith('.cpython-311-x86_64-linux-gnu.so')]
            print("Found compiled extensions in numpy/core (sample):", exts[:10])
    # check the proper compiled module spec
    spec = importlib.util.find_spec("numpy.core._multiarray_umath")
    print("find_spec('numpy.core._multiarray_umath') ->", spec)
    print("TRY import numpy.core ...")
    import numpy.core as ncore
    print("IMPORT OK: numpy.core __file__:", getattr(ncore, '__file__', None))
    # try importing the compiled ufunc module directly
    try:
        import numpy.core._multiarray_umath as _m
        print("IMPORT OK: numpy.core._multiarray_umath ->", getattr(_m, '__file__', None))
    except Exception as e:
        print("Could not import numpy.core._multiarray_umath:", repr(e))
        raise
except Exception:
    print("\nEXCEPTION DURING NUMPY DEBUG:")
    traceback.print_exc()
    sys.exit(12)
PYDBG

# install other requirements
RUN pip install --no-cache-dir -r requirements.txt

# copy app files
COPY . .

EXPOSE 8000
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:app"]
