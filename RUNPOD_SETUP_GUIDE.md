# RunPod vLLM Setup Guide - Step by Step

This guide will walk you through deploying vLLM with Llama 3.3 70B on RunPod for the Harmonic Oracle application.

## Prerequisites

- Credit card for RunPod billing
- HuggingFace account (free) for model access
- 10-15 minutes for setup

## Estimated Costs

- **GPU**: ~$2.50/hour for 2x A100 80GB
- **Storage**: ~$0.10/GB/month (need ~150GB for model)
- **Total**: ~$2.50/hour when running + ~$15/month storage

## Step 1: Create RunPod Account

1. Go to https://runpod.io
2. Click **"Sign Up"** in the top right
3. Sign up with Google, GitHub, or email
4. Verify your email address

## Step 2: Add Billing Information

1. Click on your profile icon (top right)
2. Select **"Billing"**
3. Click **"Add Credit"**
4. Add at least **$10** to start (recommended: $50 for ~20 hours)
5. You can also set up auto-recharge to avoid interruptions

## Step 3: Get HuggingFace Token (For Model Access)

1. Go to https://huggingface.co
2. Sign up or log in
3. Click on your profile → **"Settings"** → **"Access Tokens"**
4. Click **"New token"**
5. Name it "RunPod vLLM"
6. Select **"Read"** permission
7. Click **"Generate"**
8. **Copy the token** - you'll need it later

## Step 4: Deploy vLLM on RunPod

### Option A: Using RunPod Template (Easiest)

1. Go to https://runpod.io/console/pods
2. Click **"+ Deploy"** or **"New Pod"**
3. In the template search, type **"vllm"**
4. Select **"vLLM - OpenAI Compatible"** template
5. Configure the pod:

   **GPU Configuration:**
   - Select **"A100 80GB"**
   - Set **"GPU Count"** to **2**
   - Region: Choose closest to your Railway deployment (usually US or EU)
   
   **Container Configuration:**
   - Container Image: `vllm/vllm-openai:latest` (should be pre-filled)
   - Container Disk: **200 GB** (for model storage)
   
   **Environment Variables:**
   ```
   MODEL_NAME=meta-llama/Llama-3.3-70B-Instruct
   TENSOR_PARALLEL_SIZE=2
   GPU_MEMORY_UTILIZATION=0.95
   MAX_MODEL_LEN=32768
   MAX_NUM_SEQS=256
   HUGGING_FACE_HUB_TOKEN=your-hf-token-here
   ```
   
   **Exposed Ports:**
   - HTTP Port: `8000`
   
   **Volume Mounts (Optional but Recommended):**
   - Create a network volume named "vllm-models" (150GB)
   - Mount path: `/root/.cache/huggingface`
   - This caches the model so you don't re-download it every time

6. Click **"Deploy"** at the bottom

### Option B: Using Docker Command (Advanced)

If the template doesn't work, you can use the Docker command:

1. Go to https://runpod.io/console/pods
2. Click **"+ Deploy"** → **"GPU Cloud"**
3. Select **"A100 80GB"** with **2 GPUs**
4. Choose **"Docker"** deployment
5. Use this Docker command:

```bash
docker run -d \
  --gpus all \
  -p 8000:8000 \
  -e MODEL_NAME=meta-llama/Llama-3.3-70B-Instruct \
  -e TENSOR_PARALLEL_SIZE=2 \
  -e GPU_MEMORY_UTILIZATION=0.95 \
  -e MAX_MODEL_LEN=32768 \
  -e HUGGING_FACE_HUB_TOKEN=your-hf-token \
  -v /workspace/models:/root/.cache/huggingface \
  vllm/vllm-openai:latest \
  --model meta-llama/Llama-3.3-70B-Instruct \
  --tensor-parallel-size 2 \
  --gpu-memory-utilization 0.95 \
  --max-model-len 32768 \
  --host 0.0.0.0 \
  --port 8000
```

## Step 5: Wait for Model to Load

1. Click on your pod name to open the pod details
2. Click **"Logs"** to watch the startup process
3. You'll see:
   ```
   Downloading model...
   Loading model weights...
   Initializing vLLM engine...
   INFO: Started server process
   INFO: Application startup complete.
   ```
4. **This takes 10-20 minutes** for the first startup (downloading 140GB model)
5. Subsequent startups are much faster (~2-3 minutes) if using network volume

## Step 6: Get Your vLLM Endpoint URL

1. In the pod details, look for **"Connect"** section
2. You'll see an **"HTTP Service"** URL like:
   ```
   https://xxxxx-8000.proxy.runpod.net
   ```
3. **Copy this URL** - this is your `LLM_API_URL`

## Step 7: Test Your vLLM Endpoint

Test that vLLM is working correctly:

```bash
curl https://xxxxx-8000.proxy.runpod.net/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "meta-llama/Llama-3.3-70B-Instruct",
    "messages": [
      {"role": "user", "content": "Write a Python function to calculate fibonacci numbers"}
    ],
    "max_tokens": 500
  }'
```

You should get a response with generated code!

## Step 8: Optional - Set Up API Key Authentication

For security, you can add API key authentication:

1. In your RunPod pod, add this environment variable:
   ```
   VLLM_API_KEY=your-secret-api-key-here
   ```
2. Restart the pod
3. Now all requests must include:
   ```
   Authorization: Bearer your-secret-api-key-here
   ```

## Step 9: Configure Railway Environment Variables

Now add these variables to your Railway project:

1. Go to your Railway project
2. Click on **harmonic-oracle** service
3. Click **"Variables"** tab
4. Click **"New Variable"** and add:

```bash
LLM_API_URL=https://xxxxx-8000.proxy.runpod.net
LLM_API_KEY=your-secret-api-key-here  # If you set one in Step 8
LLM_MODEL=meta-llama/Llama-3.3-70B-Instruct
LLM_MAX_TOKENS=32768
```

5. Click **"Deploy"** to apply changes

## Step 10: Test Integration

1. Wait for Railway deployment to complete (~2-3 minutes)
2. Go to your Harmonic Oracle application
3. Navigate to **Code Synthesis** or **Agent Lab**
4. Submit a test task like: "Write a Python function to sort a list"
5. You should see the response generated by Llama 3.3 70B!

## Monitoring and Management

### Check GPU Usage
```bash
# SSH into your RunPod pod (click "Terminal" in pod details)
nvidia-smi
```

### Check vLLM Metrics
```bash
curl https://xxxxx-8000.proxy.runpod.net/metrics
```

### View Logs
Click **"Logs"** in the pod details to see real-time logs

### Stop/Start Pod
- **Stop**: Click **"Stop"** to pause billing (you'll still pay for storage)
- **Start**: Click **"Start"** to resume
- **Terminate**: Click **"Terminate"** to delete completely (stops all charges)

## Cost Optimization Tips

### 1. Use Network Volumes
- Create a persistent network volume for model cache
- Saves 10-20 minutes on every restart
- Only pay ~$15/month for storage

### 2. Stop When Not In Use
- Stop the pod when you're not using it
- You only pay for storage (~$15/month)
- Start it when you need it

### 3. Use Spot Instances (Advanced)
- RunPod offers "Spot" instances at 50% discount
- Risk: Can be interrupted if demand is high
- Good for development, not production

### 4. Use Smaller Model for Development
- For testing, use Llama 3.1 8B Instruct
- Only needs 1x RTX 4090 (~$0.30/hour)
- Change `MODEL_NAME=meta-llama/Llama-3.1-8B-Instruct`
- Change `TENSOR_PARALLEL_SIZE=1`

## Troubleshooting

### Pod Won't Start
- **Check billing**: Make sure you have sufficient credits
- **Check GPU availability**: A100 80GB might be sold out in some regions
- **Try different region**: US, EU, or Asia

### Model Download Fails
- **Check HuggingFace token**: Make sure it's valid and has read permissions
- **Check disk space**: Need at least 150GB for Llama 3.3 70B
- **Check network**: Model download requires stable connection

### Out of Memory (OOM)
```bash
# Reduce GPU memory utilization
GPU_MEMORY_UTILIZATION=0.85

# Reduce context length
MAX_MODEL_LEN=16384

# Use smaller model
MODEL_NAME=meta-llama/Llama-3.1-70B-Instruct  # Slightly smaller
```

### Slow Inference
- **Check GPU count**: Make sure `TENSOR_PARALLEL_SIZE` matches GPU count
- **Enable FP8 quantization**: Add `--quantization fp8` for 2x speed
- **Reduce batch size**: Lower `MAX_NUM_SEQS` if memory is tight

### Connection Refused
- **Check port**: Make sure port 8000 is exposed
- **Check logs**: Look for startup errors
- **Wait longer**: Model loading takes 10-20 minutes first time

## Alternative Models

If Llama 3.3 70B is too expensive or slow, try these:

### Llama 3.1 8B Instruct (Budget)
```bash
MODEL_NAME=meta-llama/Llama-3.1-8B-Instruct
TENSOR_PARALLEL_SIZE=1
# GPU: 1x RTX 4090 (~$0.30/hour)
```

### Qwen 2.5 72B Instruct (Multilingual)
```bash
MODEL_NAME=Qwen/Qwen2.5-72B-Instruct
TENSOR_PARALLEL_SIZE=2
# GPU: 2x A100 80GB (~$2.50/hour)
```

### Mistral Large 2 (Fast)
```bash
MODEL_NAME=mistralai/Mistral-Large-Instruct-2407
TENSOR_PARALLEL_SIZE=2
# GPU: 2x A100 80GB (~$2.50/hour)
```

## Next Steps

Once your vLLM is running:

1. ✅ Test Code Synthesis tool
2. ✅ Test Agent Lab task submission
3. ✅ Monitor GPU usage and costs
4. ✅ Consider setting up auto-scaling (advanced)
5. ✅ Set up monitoring alerts (optional)

## Support

- **RunPod Discord**: https://discord.gg/runpod
- **vLLM GitHub**: https://github.com/vllm-project/vllm
- **RunPod Docs**: https://docs.runpod.io

---

**Ready to start?** Let me know when you've completed each step and I'll help you with any issues!
