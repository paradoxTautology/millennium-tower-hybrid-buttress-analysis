#!/usr/bin/env python3
"""
Run the Millennium Tower structural analysis.

Compares four scenarios:
  1. Baseline — original friction piles (no fix)
  2. PPU Only — perimeter piles to bedrock (current fix)
  3. Hybrid — PPU + above-ground buttress ties
  4. Phased — buttress ties stabilize, then soil extraction (Pisa method)

Outputs results to analysis/results/ as JSON.

Usage:
    python run_analysis.py
"""

import os
import sys

# Add parent to path for imports
sys.path.insert(0, os.path.dirname(__file__))

from millennium_model import run_full_analysis
import json

def main():
    results = run_full_analysis()
    
    # Save full results
    output_dir = os.path.join(os.path.dirname(__file__), 'results')
    os.makedirs(output_dir, exist_ok=True)
    
    output_path = os.path.join(output_dir, 'analysis_results.json')
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\nFull results saved to: {output_path}")
    
    # Save a compact summary
    summary = {}
    for scenario_key, data in results.items():
        if isinstance(data, dict) and 'label' in data:
            summary[scenario_key] = {
                'label': data['label'],
                'tilt': data['tilt'],
                'forces': data['forces'],
            }
    
    summary_path = os.path.join(output_dir, 'summary.json')
    with open(summary_path, 'w') as f:
        json.dump(summary, f, indent=2)
    
    print(f"Summary saved to: {summary_path}")


if __name__ == "__main__":
    main()
