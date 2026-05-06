# Methodology

## Model Overview

Beam-on-elastic-foundation (Winkler model) comparing five scenarios across the foundation mat width. Standard geotechnical approach for mat foundations on soft soil.

## Building Parameters

645 ft, 58 stories, reinforced concrete. ~1,500,000 kN total weight. Mat foundation ~10 ft thick, ~140 ft × 140 ft. Original friction piles to ~80 ft in clay (not bedrock at ~220 ft).

## Soil Model

Bay Mud subgrade modulus: 3,000 kN/m³. Creep degradation: `k_eff = k / (1 + rate × years)`. Base creep rate: 0.02/year, amplified 20% by tidal pumping (twice-daily water table fluctuation).

For grouted scenarios: creep rate drops to 0.002/year (90% reduction — soilcrete doesn't creep like saturated clay).

## Five Scenarios

**1. Baseline**: Friction piles add 2,000 kN/m³ distributed support. Uniform.

**2. PPU Only**: West/NW edge stiffened to 200,000-300,000 kN/m³ (bedrock piles). Creates large stiffness differential.

**3. Hybrid**: PPU + buttress tie moment redistribution. Progressive stiffness increase toward unsupported east side (+80,000 kN/m³) plus Gaussian center boost (+40,000 kN/m³).

**4. Phased**: Hybrid + soil extraction. East 45% of mat: linearly ramped 45% clay stiffness reduction. Center relief: +25,000 kN/m³ Gaussian.

**5. Full Phased**: Phased + jet grouting:
- Uniform +24,000 kN/m³ across entire footprint (60,000 × 40% coverage)
- Targeted center: +80,000 kN/m³ Gaussian (denser column spacing under core)
- Extraction zone backfill: +30,000 kN/m³ linear ramp (soilcrete replaces removed clay)
- Creep rate: 0.002/year (90% reduction)

## Jet Grouting Parameters

From published soilcrete data: UCS 1-15 MPa (vs clay 0.03 MPa). Modulus 100-500 MPa (vs clay 5 MPa). Column diameter 0.6-1.2m, spacing 1.5-2m, 40% coverage ratio. Treatment depth: 0-80 ft (friction pile zone).

## Tower Lateral Model

Cantilever with base tilt and P-delta effects. Tie restraint: 35-40% reduction above connection height. Extraction: 35% base tilt correction. Grouting: additional 25% residual tilt reduction (stiffer base).

## Phased Timeline

Linear transitions between scenarios: PPU (yr 0-17) → hybrid (yr 17-20) → phased (yr 20-25) → full_phased (yr 25-28) → monitoring (yr 28-35).

## Numerical Solution

50-element finite difference. Free-edge boundary conditions. Direct linear solve.
