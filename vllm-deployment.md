# vLLM Deployment Guide for Harmonic Oracle

This guide explains how to deploy vLLM with Llama 3.3 70B Instruct for the Harmonic Oracle application.

## Overview

vLLM is a high-performance inference engine that provides an OpenAI-compatible API for serving large language models. We'll use **Llama 3.3 70B Instruct**, which offers excellent performance for reasoning and code generation tasks.

## Architecture

```
┌─────────────────────┐         ┌──────────────────┐
│  Harmonic Oracle    │────────▶│   vLLM Server    │
│  (Railway)          │  HTTP   │   (GPU Instance) │
│                     │◀────────│   Llama 3.3 70B  │
└─────────────────────┘         └──────────────────┘
```

## Deployment Options

### Option 1: RunPod (Recommended - Cost-Effective)

**RunPod** offers affordable GPU instances with pre-configured vLLM templates.

#### Specs Required:
- **GPU**: 2x NVIDIA A100 80GB (for Llama 3.3 70B)
- **RAM**: 128GB+
- **Storage**: 500GB SSD

#### Estimated Cost:
- **~$2.50/hour** for 2x A100 80GB on RunPod

#### Setup Steps:

1. **Create RunPod Account**
   - Go to https://runpod.io
   - Sign up and add payment method

2. **Deploy vLLM Template**
   ```bash
   # Use RunPod's vLLM template
   # Template ID: runpod/vllm:latest
   ```

3. **Configure Environment Variables**
   ```bash
   MODEL_NAME=meta-llama/Llama-3.3-70B-Instruct
   TENSOR_PARALLEL_SIZE=2
   GPU_MEMORY_UTILIZATION=0.95
   MAX_MODEL_LEN=32768
   TRUST_REMOTE_CODE=true
   ```

4. **Deploy and Get Endpoint**
   - RunPod will provide an endpoint URL like: `https://xxxxx-8000.proxy.runpod.net`
   - This URL is your `LLM_API_URL`

5. **Set API Key (Optional)**
   - RunPod vLLM deployments can be configured with API key authentication
   - Set `VLLM_API_KEY` in RunPod environment

### Option 2: Modal (Serverless - Pay Per Use)

**Modal** offers serverless GPU compute with automatic scaling.

#### Estimated Cost:
- **~$0.001/second** of GPU time (only when in use)
- Scales to zero when idle

#### Setup Steps:

1. **Install Modal CLI**
   ```bash
   pip install modal
   modal setup
   ```

2. **Create vLLM Deployment Script**
   ```python
   # vllm_modal.py
   import modal
   
   stub = modal.Stub("harmonic-oracle-vllm")
   
   image = (
       modal.Image.debian_slim()
       .pip_install("vllm==0.6.3")
   )
   
   @stub.function(
       image=image,
       gpu=modal.gpu.A100(count=2, size="80GB"),
       timeout=3600,
   )
   @modal.web_endpoint(method="POST")
   def inference(request: dict):
       from vllm import LLM, SamplingParams
       
       llm = LLM(
           model="meta-llama/Llama-3.3-70B-Instruct",
           tensor_parallel_size=2,
           gpu_memory_utilization=0.95,
       )
       
       # OpenAI-compatible endpoint logic
       messages = request["messages"]
       # ... implement chat completion logic
       
       return {"choices": [...]}
   ```

3. **Deploy**
   ```bash
   modal deploy vllm_modal.py
   ```

4. **Get Endpoint URL**
   - Modal will provide a URL like: `https://username--harmonic-oracle-vllm-inference.modal.run`

### Option 3: Together.ai (Managed - Easiest)

**Together.ai** provides managed vLLM hosting with Llama models.

#### Estimated Cost:
- **$0.60/1M tokens** for Llama 3.3 70B

#### Setup Steps:

1. **Create Together.ai Account**
   - Go to https://together.ai
   - Sign up and get API key

2. **No Deployment Needed!**
   - Together.ai already hosts Llama 3.3 70B
   - Just use their API endpoint

3. **Configuration**
   ```bash
   LLM_API_URL=https://api.together.xyz
   LLM_API_KEY=your-together-api-key
   LLM_MODEL=meta-llama/Llama-3.3-70B-Instruct-Turbo
   ```

### Option 4: Self-Hosted (Full Control)

Deploy vLLM on your own GPU server.

#### Requirements:
- **GPU**: 2x NVIDIA A100 80GB or 4x A6000 48GB
- **RAM**: 128GB+
- **Storage**: 500GB NVMe SSD
- **OS**: Ubuntu 22.04 LTS

#### Setup Steps:

1. **Install CUDA and Drivers**
   ```bash
   # Install NVIDIA drivers and CUDA 12.1
   sudo apt update
   sudo apt install -y nvidia-driver-535 nvidia-cuda-toolkit
   ```

2. **Install vLLM**
   ```bash
   pip install vllm==0.6.3
   ```

3. **Download Model**
   ```bash
   # Models are auto-downloaded from HuggingFace
   # Requires ~140GB storage for Llama 3.3 70B
   ```

4. **Start vLLM Server**
   ```bash
   python -m vllm.entrypoints.openai.api_server \
     --model meta-llama/Llama-3.3-70B-Instruct \
     --tensor-parallel-size 2 \
     --gpu-memory-utilization 0.95 \
     --max-model-len 32768 \
     --host 0.0.0.0 \
     --port 8000
   ```

5. **Expose with Reverse Proxy**
   ```nginx
   # nginx configuration
   server {
       listen 443 ssl;
       server_name vllm.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

## Railway Environment Variables

After deploying vLLM, add these environment variables to your Railway project:

```bash
# vLLM Configuration
LLM_API_URL=https://your-vllm-endpoint.com
LLM_API_KEY=your-api-key-if-required
LLM_MODEL=meta-llama/Llama-3.3-70B-Instruct
LLM_MAX_TOKENS=32768
```

## Testing vLLM Endpoint

Test your vLLM deployment with curl:

```bash
curl https://your-vllm-endpoint.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "model": "meta-llama/Llama-3.3-70B-Instruct",
    "messages": [
      {"role": "user", "content": "Write a Python function to calculate fibonacci numbers"}
    ],
    "max_tokens": 1000
  }'
```

## Alternative Models

If Llama 3.3 70B is too expensive, consider these alternatives:

### Llama 3.3 70B Instruct
- **Best for**: Production, complex reasoning, code generation
- **GPU**: 2x A100 80GB
- **Cost**: ~$2.50/hour (RunPod)

### Llama 3.1 8B Instruct
- **Best for**: Development, testing, simple tasks
- **GPU**: 1x RTX 4090 24GB
- **Cost**: ~$0.30/hour (RunPod)
- **Model**: `meta-llama/Llama-3.1-8B-Instruct`

### Qwen 2.5 72B Instruct
- **Best for**: Multilingual, strong reasoning
- **GPU**: 2x A100 80GB
- **Cost**: ~$2.50/hour (RunPod)
- **Model**: `Qwen/Qwen2.5-72B-Instruct`

### DeepSeek-V3
- **Best for**: Code generation, math reasoning
- **GPU**: 4x A100 80GB (large model)
- **Cost**: ~$5/hour (RunPod)
- **Model**: `deepseek-ai/DeepSeek-V3`

## Performance Tuning

### Increase Throughput
```bash
# Enable continuous batching
--enable-chunked-prefill

# Increase batch size
--max-num-seqs 256

# Use FP8 quantization (2x faster, minimal quality loss)
--quantization fp8
```

### Reduce Latency
```bash
# Disable prefix caching for lower latency
--disable-prefix-caching

# Use speculative decoding
--speculative-model meta-llama/Llama-3.1-8B-Instruct
```

## Monitoring

Monitor vLLM performance with these metrics:

```bash
# Check GPU utilization
nvidia-smi

# vLLM metrics endpoint
curl http://localhost:8000/metrics
```

## Troubleshooting

### Out of Memory (OOM)
```bash
# Reduce GPU memory utilization
--gpu-memory-utilization 0.85

# Reduce max model length
--max-model-len 16384

# Enable CPU offloading
--cpu-offload-gb 10
```

### Slow Inference
```bash
# Check tensor parallelism matches GPU count
--tensor-parallel-size 2  # For 2 GPUs

# Enable FP8 quantization
--quantization fp8
```

## Next Steps

1. **Choose a deployment option** (I recommend Together.ai for easiest setup, or RunPod for best cost/performance)
2. **Deploy vLLM** following the steps above
3. **Get your endpoint URL and API key**
4. **Add environment variables to Railway**
5. **Test the integration**

Let me know which option you'd like to proceed with!
