import React, { useState } from "react";
import { Brain, Zap, Grid3x3, Play, Download, Info } from "lucide-react";

export default function ARCMetaLearner() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showCode, setShowCode] = useState(false);

  const architectureSteps = [
    {
      title: "1. Pre-training Phase",
      desc: "Train a model on ARC training tasks to learn core knowledge priors",
      hcs: "Use HCS to find robust, sparse representations of visual transformations",
      icon: Brain,
    },
    {
      title: "2. Meta-Learning Setup",
      desc: "Learn to learn: optimize for quick adaptation to new tasks with few examples",
      hcs: "Geodesic path guides toward solutions that adapt quickly when fine-tuned",
      icon: Zap,
    },
    {
      title: "3. Test-Time Adaptation",
      desc: "Given 3–5 examples of a new task, adapt rapidly to predict outputs",
      hcs: "Start from flat minima found by HCS = faster, more stable adaptation",
      icon: Grid3x3,
    },
  ];

  const implementationPlan = [
    {
      phase: "Phase 1: Grid Encoder Network",
      tasks: [
        "Build transformer that encodes ARC grids (30×30 max, 10 colors)",
        "Use HCS to train on all training tasks",
        "Optimize for: low loss, robustness to noise, sparse attention patterns",
      ],
      days: "Week 1–2",
    },
    {
      phase: "Phase 2: Meta-Learning Loop",
      tasks: [
        "Sample task, split into support (train) and query (test) sets",
        "Fine-tune encoder on support set using HCS",
        "Measure performance on query set",
        "Meta-optimize: adjust pre-trained weights so fine-tuning is faster",
      ],
      days: "Week 3–4",
    },
    {
      phase: "Phase 3: Enhanced HCS for ARC",
      tasks: [
        "Geodesic: train on augmented/noisy grids → robust solutions",
        "Sparsity: encourage attention to key grid features only",
        "Harmonic: seek flat minima → better generalization to test tasks",
      ],
      days: "Week 5–6",
    },
    {
      phase: "Phase 4: Testing & Refinement",
      tasks: [
        "Test on a public eval set",
        "Compare: HCS meta-learner vs standard Adam optimizer",
        "Measure: accuracy, adaptation speed, compute efficiency",
      ],
      days: "Week 7–8",
    },
  ];

  const whyHCS = [
    {
      problem: "Standard optimizers overfit quickly",
      solution: "HCS seeks flatter minima → better generalization",
    },
    {
      problem: "Need robustness to task variations",
      solution: "Geodesic-style training on perturbed data → robust representations",
    },
    {
      problem: "Limited examples per task (3–5)",
      solution: "Sparsity constraints → focus on essential features only",
    },
    {
      problem: "Must adapt quickly per task",
      solution: "Start from flat minima → faster convergence",
    },
  ];

  const codeTemplate = `# arc_hcs_metalearner.py
import numpy as np
import torch
import torch.nn as nn

class ARCGridEncoder(nn.Module):
    def __init__(self, grid_size=30, num_colors=10, d_model=256):
        super().__init__()
        self.embed = nn.Embedding(num_colors, d_model)
        self.pos = nn.Parameter(torch.randn(grid_size*grid_size, d_model))
        layer = nn.TransformerEncoderLayer(d_model=d_model, nhead=8, dim_feedforward=1024)
        self.enc = nn.TransformerEncoder(layer, num_layers=6)
        self.head = nn.Linear(d_model, num_colors * grid_size * grid_size)

    def forward(self, grid):
        b, h, w = grid.shape
        x = self.embed(grid.flatten(1))
        x = x + self.pos[:h*w]
        x = self.enc(x)
        x = x.mean(dim=1)
        out = self.head(x)
        return out.view(b, h, w, -1)
`;

  return (
    <div className="rounded-xl border border-slate-700 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            HCS Meta-Learner for ARC
          </h1>
          <p className="text-gray-300">
            A lab UI for exploring HCS-inspired meta-learning on ARC-style visual reasoning.
          </p>
        </div>

        <div className="flex gap-2 mb-6 bg-slate-800/50 p-2 rounded-lg">
          {["overview", "architecture", "implementation", "why-hcs"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md font-medium transition-all ${
                activeTab === tab
                  ? "bg-purple-600 text-white shadow-lg"
                  : "text-gray-300 hover:bg-slate-700"
              }`}
            >
              {tab
                .split("-")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ")}
            </button>
          ))}
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 shadow-2xl border border-slate-700">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-blue-900/30 rounded-lg border border-blue-700/50">
                <Info className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg mb-2">The Core Idea</h3>
                  <p className="text-gray-300">
                    ARC tasks are few-shot visual programs. This lab is a roadmap UI for combining
                    sparse representations, robustness, and fast adaptation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "architecture" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">System Architecture</h2>
              {architectureSteps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={idx} className="p-5 bg-slate-700/50 rounded-lg border border-slate-600">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-purple-600/20 rounded-lg">
                        <Icon className="w-7 h-7 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-1">{step.title}</h3>
                        <p className="text-gray-300 mb-3">{step.desc}</p>
                        <div className="p-3 bg-purple-900/30 rounded border border-purple-700/50">
                          <p className="text-sm text-purple-200">
                            <strong>HCS Advantage:</strong> {step.hcs}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "implementation" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Implementation Plan</h2>
              {implementationPlan.map((phase, idx) => (
                <div key={idx} className="p-5 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-blue-300">{phase.phase}</h3>
                    <span className="text-xs text-gray-300 bg-slate-800 px-3 py-1 rounded-full">
                      {phase.days}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {phase.tasks.map((task, tidx) => (
                      <li key={tidx} className="flex items-start gap-2 text-gray-200 text-sm">
                        <span className="text-purple-300 mt-1">▸</span>
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <button
                onClick={() => setShowCode(!showCode)}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-medium transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                {showCode ? "Hide" : "Show"} Code Template
              </button>

              {showCode && (
                <div className="bg-slate-950 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-green-300">
                    <code>{codeTemplate}</code>
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeTab === "why-hcs" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Why HCS Helps</h2>
              {whyHCS.map((item, idx) => (
                <div key={idx} className="p-5 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-red-300 mb-2">Problem</h3>
                      <p className="text-gray-200 text-sm">{item.problem}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-green-300 mb-2">HCS Solution</h3>
                      <p className="text-gray-200 text-sm">{item.solution}</p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="mt-4 p-6 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-700/50">
                <h3 className="text-lg font-bold mb-2">Multi-objective optimization</h3>
                <p className="text-gray-200 text-sm">
                  Beyond loss: robustness, sparsity, and stable minima.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  {["Low Loss", "Robustness", "Flat Minima", "Sparsity"].map((obj) => (
                    <div key={obj} className="text-center p-3 bg-slate-800/50 rounded-lg text-sm">
                      ✓ {obj}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 p-5 bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-xl border border-green-700/50 text-center">
          <h3 className="text-lg font-bold mb-1">Ready to Build?</h3>
          <p className="text-gray-200 text-sm">
            This lab UI is ready. Next step is wiring /api/arc/start + /api/arc/status.
          </p>
          <div className="flex gap-3 justify-center mt-4">
            <button className="px-5 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-all shadow-lg flex items-center gap-2">
              <Play className="w-4 h-4" />
              Start Phase 1
            </button>
            <button className="px-5 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-all">
              View Roadmap
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
