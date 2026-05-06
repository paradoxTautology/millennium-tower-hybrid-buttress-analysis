"""
MILLENNIUM TOWER - SIMPLIFIED STRUCTURAL MODEL
Comparing five scenarios:
  1. Baseline: Original condition (friction piles on clay, no fix)
  2. PPU Only: Current fix (perimeter piles to bedrock)
  3. Hybrid: PPU + above-ground buttress ties
  4. Phased: Buttress ties → soil extraction (Pisa method)
  5. Full Phased: Buttress ties → extraction → jet grouting (lock-in)

Model approach:
  - Foundation mat: beam-on-elastic-foundation (Winkler model)
  - Clay: springs degrade under sustained load (consolidation/creep)
  - Tidal pumping: modeled as cyclic effective stress variation
  - Piles: rigid point supports at bedrock
  - Buttress ties: lateral spring restraints at height
  - Soil extraction: selective subgrade stiffness reduction
  - Jet grouting: subgrade stiffness increase + creep elimination
"""

import numpy as np
import json

# =============================================================================
# BUILDING PARAMETERS
# =============================================================================
STORIES = 58
HEIGHT_FT = 645.0
HEIGHT_M = HEIGHT_FT * 0.3048
FOOTPRINT_W_FT = 140.0
FOOTPRINT_L_FT = 140.0
FOOTPRINT_W_M = FOOTPRINT_W_FT * 0.3048
FOOTPRINT_L_M = FOOTPRINT_L_FT * 0.3048

TOTAL_WEIGHT_KN = 1_500_000
WEIGHT_PER_STORY_KN = TOTAL_WEIGHT_KN / STORIES

MAT_THICKNESS_M = 3.0
MAT_WIDTH_M = FOOTPRINT_W_M
MAT_LENGTH_M = FOOTPRINT_L_M

# =============================================================================
# SOIL PARAMETERS
# =============================================================================
CLAY_UNDRAINED_STRENGTH_KPA = 30.0
CLAY_MODULUS_KPA = 5_000.0
CLAY_SUBGRADE_MODULUS_KN_M3 = 3_000
CLAY_CREEP_RATE = 0.02               # annual creep strain rate (raw clay)

BEDROCK_DEPTH_FT = 220.0
BEDROCK_DEPTH_M = BEDROCK_DEPTH_FT * 0.3048

FRICTION_PILE_DEPTH_FT = 80.0
FRICTION_PILE_DEPTH_M = FRICTION_PILE_DEPTH_FT * 0.3048

# Tidal pumping effect on clay
# SF Bay tides cycle effective stress ~2x daily
# This accelerates creep by ~15-25% over static conditions
TIDAL_CREEP_AMPLIFICATION = 1.20  # 20% faster creep due to water table cycling

# =============================================================================
# FIX PARAMETERS
# =============================================================================
N_PILES_PPU = 18
PILE_CAPACITY_KN = 15_000
TOTAL_PPU_CAPACITY_KN = N_PILES_PPU * PILE_CAPACITY_KN

CURRENT_TILT_INCHES = 28.0
CURRENT_TILT_M = CURRENT_TILT_INCHES * 0.0254
CURRENT_SETTLEMENT_INCHES = 18.0
CURRENT_SETTLEMENT_M = CURRENT_SETTLEMENT_INCHES * 0.0254

# =============================================================================
# BUTTRESS PARAMETERS
# =============================================================================
N_BUTTRESS_PILLARS = 4
BUTTRESS_HEIGHT_M = 60.0
BUTTRESS_DISTANCE_M = 15.0
BUTTRESS_PILE_DEPTH_M = BEDROCK_DEPTH_M
TIE_STIFFNESS_KN_M = 500_000

# =============================================================================
# SOIL EXTRACTION PARAMETERS (Pisa Method)
# =============================================================================
EXTRACTION_ZONE_START = 0.55
EXTRACTION_ZONE_END = 1.0
EXTRACTION_STIFFNESS_REDUCTION = 0.45

# =============================================================================
# JET GROUTING PARAMETERS
# =============================================================================
# Jet grouting creates soilcrete columns in-situ by injecting high-pressure
# cement slurry that mixes with and replaces the native clay.
#
# Soilcrete properties (from literature):
#   - UCS: 1-15 MPa (vs clay Su ~30 kPa — 30-500x stronger)
#   - Modulus: 100-500 MPa (vs clay 5 MPa — 20-100x stiffer)
#   - Subgrade modulus: 50,000-150,000 kN/m³ (vs clay 3,000)
#
# Column geometry:
#   - Typical diameter: 0.6-1.2m per column
#   - Spacing: 1.5-2.0m center-to-center
#   - Coverage ratio: ~30-50% of plan area
#   - Depth: friction pile zone (0-80ft) where clay is weakest
#
# Key effect: grouting replaces water-filled pore space with cement.
# This eliminates the tidal pumping mechanism (no water to cycle)
# and arrests the ongoing creep/consolidation.

GROUT_SUBGRADE_BOOST = 60_000     # kN/m³ added stiffness (conservative soilcrete)
GROUT_COVERAGE = 0.40             # 40% of plan area treated
GROUT_CREEP_RATE = 0.002          # 90% reduction in creep rate (cement doesn't creep like clay)
GROUT_CENTER_BOOST = 80_000       # extra stiffness at center (targeted treatment for dishing)


# =============================================================================
# FOUNDATION MODEL
# =============================================================================
class FoundationModel:
    """1D Beam-on-elastic-foundation using finite differences"""
    
    def __init__(self, n_elements=50):
        self.n = n_elements
        self.dx = MAT_WIDTH_M / n_elements
        self.x = np.linspace(0, MAT_WIDTH_M, n_elements + 1)
        
    def solve_settlement(self, scenario="baseline", years=17):
        n = self.n + 1
        x = self.x
        dx = self.dx
        
        # Load distribution (30% heavier at center = structural core)
        x_norm = (x - MAT_WIDTH_M/2) / (MAT_WIDTH_M/2)
        load_profile = 1.0 + 0.3 * (1 - x_norm**2)
        q = (TOTAL_WEIGHT_KN / MAT_WIDTH_M) * load_profile / np.mean(load_profile)
        
        # Base subgrade reaction
        k = np.ones(n) * CLAY_SUBGRADE_MODULUS_KN_M3 * MAT_LENGTH_M
        
        # Time-dependent degradation
        # For grouted scenarios, use reduced creep rate
        if scenario == "full_phased":
            creep_rate = GROUT_CREEP_RATE
        else:
            creep_rate = CLAY_CREEP_RATE * TIDAL_CREEP_AMPLIFICATION
        
        consolidation_factor = 1.0 + creep_rate * years
        k_degraded = k / consolidation_factor
        
        # ── SCENARIO LOGIC ──
        
        if scenario == "baseline":
            friction_pile_support = 2_000
            k_effective = k_degraded + friction_pile_support
            
        elif scenario == "ppu_only":
            k_effective = k_degraded.copy()
            pile_zone_west = x < MAT_WIDTH_M * 0.15
            k_effective[pile_zone_west] += 200_000
            pile_zone_nw = x < MAT_WIDTH_M * 0.25
            k_effective[pile_zone_nw] += 100_000
            
        elif scenario == "hybrid":
            k_effective = k_degraded.copy()
            pile_zone_west = x < MAT_WIDTH_M * 0.15
            k_effective[pile_zone_west] += 200_000
            pile_zone_nw = x < MAT_WIDTH_M * 0.25
            k_effective[pile_zone_nw] += 100_000
            
            x_norm_shift = (x - MAT_WIDTH_M * 0.3) / (MAT_WIDTH_M * 0.7)
            x_norm_shift = np.clip(x_norm_shift, 0, 1)
            buttress_effect = 80_000 * x_norm_shift
            k_effective += buttress_effect
            
            center_boost = 40_000 * np.exp(-((x - MAT_WIDTH_M/2)/(MAT_WIDTH_M/4))**2)
            k_effective += center_boost
            
        elif scenario == "phased":
            # Phase 1: Buttress ties
            k_effective = k_degraded.copy()
            pile_zone_west = x < MAT_WIDTH_M * 0.15
            k_effective[pile_zone_west] += 200_000
            pile_zone_nw = x < MAT_WIDTH_M * 0.25
            k_effective[pile_zone_nw] += 100_000
            
            x_norm_shift = (x - MAT_WIDTH_M * 0.3) / (MAT_WIDTH_M * 0.7)
            x_norm_shift = np.clip(x_norm_shift, 0, 1)
            buttress_effect = 80_000 * x_norm_shift
            k_effective += buttress_effect
            center_boost = 40_000 * np.exp(-((x - MAT_WIDTH_M/2)/(MAT_WIDTH_M/4))**2)
            k_effective += center_boost
            
            # Phase 2: Soil extraction on high side (east)
            x_frac = x / MAT_WIDTH_M
            extraction_profile = np.zeros(n)
            for i in range(n):
                xf = x_frac[i]
                if xf >= EXTRACTION_ZONE_START:
                    progress = (xf - EXTRACTION_ZONE_START) / (EXTRACTION_ZONE_END - EXTRACTION_ZONE_START)
                    extraction_profile[i] = progress * EXTRACTION_STIFFNESS_REDUCTION
            
            clay_component = k_degraded.copy()
            k_effective -= clay_component * extraction_profile
            
            center_relief = 25_000 * np.exp(-((x - MAT_WIDTH_M * 0.5)/(MAT_WIDTH_M/3))**2)
            k_effective += center_relief
            
        elif scenario == "full_phased":
            # Phase 1: Buttress ties (same as hybrid)
            k_effective = k_degraded.copy()  # already using reduced creep rate
            pile_zone_west = x < MAT_WIDTH_M * 0.15
            k_effective[pile_zone_west] += 200_000
            pile_zone_nw = x < MAT_WIDTH_M * 0.25
            k_effective[pile_zone_nw] += 100_000
            
            x_norm_shift = (x - MAT_WIDTH_M * 0.3) / (MAT_WIDTH_M * 0.7)
            x_norm_shift = np.clip(x_norm_shift, 0, 1)
            buttress_effect = 80_000 * x_norm_shift
            k_effective += buttress_effect
            center_boost = 40_000 * np.exp(-((x - MAT_WIDTH_M/2)/(MAT_WIDTH_M/4))**2)
            k_effective += center_boost
            
            # Phase 2: Soil extraction (same as phased)
            x_frac = x / MAT_WIDTH_M
            extraction_profile = np.zeros(n)
            for i in range(n):
                xf = x_frac[i]
                if xf >= EXTRACTION_ZONE_START:
                    progress = (xf - EXTRACTION_ZONE_START) / (EXTRACTION_ZONE_END - EXTRACTION_ZONE_START)
                    extraction_profile[i] = progress * EXTRACTION_STIFFNESS_REDUCTION
            
            clay_component = k_degraded.copy()
            k_effective -= clay_component * extraction_profile
            
            center_relief = 25_000 * np.exp(-((x - MAT_WIDTH_M * 0.5)/(MAT_WIDTH_M/3))**2)
            k_effective += center_relief
            
            # Phase 3: JET GROUTING
            # Uniform stiffness boost across entire footprint
            # (soilcrete columns at 40% coverage ratio)
            grout_uniform = GROUT_SUBGRADE_BOOST * GROUT_COVERAGE * MAT_LENGTH_M / MAT_LENGTH_M
            k_effective += grout_uniform
            
            # Targeted center grouting — denser column spacing under the core
            # to directly address center dishing
            grout_center = GROUT_CENTER_BOOST * np.exp(-((x - MAT_WIDTH_M/2)/(MAT_WIDTH_M/5))**2)
            k_effective += grout_center
            
            # Grouting in extraction zone — backfill the weakened area
            # with soilcrete to create a stiff, uniform support
            grout_extraction_backfill = np.zeros(n)
            for i in range(n):
                xf = x_frac[i]
                if xf >= EXTRACTION_ZONE_START:
                    progress = (xf - EXTRACTION_ZONE_START) / (EXTRACTION_ZONE_END - EXTRACTION_ZONE_START)
                    grout_extraction_backfill[i] = 30_000 * progress
            k_effective += grout_extraction_backfill
        
        # ── SOLVE ──
        E_concrete = 30e6
        I_mat = MAT_LENGTH_M * MAT_THICKNESS_M**3 / 12
        EI = E_concrete * I_mat
        
        K = np.zeros((n, n))
        F = q * dx
        
        for i in range(2, n-2):
            coeff = EI / dx**4
            K[i, i-2] += coeff
            K[i, i-1] += -4 * coeff
            K[i, i]   += 6 * coeff + k_effective[i] * dx
            K[i, i+1] += -4 * coeff
            K[i, i+2] += coeff
        
        K[0, 0] = k_effective[0] * dx + EI/dx**4
        K[0, 1] = -2 * EI/dx**4
        K[0, 2] = EI/dx**4
        K[1, 0] = -2 * EI/dx**4
        K[1, 1] = 5 * EI/dx**4 + k_effective[1] * dx
        K[1, 2] = -4 * EI/dx**4
        K[1, 3] = EI/dx**4
        
        K[-1, -1] = k_effective[-1] * dx + EI/dx**4
        K[-1, -2] = -2 * EI/dx**4
        K[-1, -3] = EI/dx**4
        K[-2, -1] = -2 * EI/dx**4
        K[-2, -2] = 5 * EI/dx**4 + k_effective[-2] * dx
        K[-2, -3] = -4 * EI/dx**4
        K[-2, -4] = EI/dx**4
        
        try:
            w = np.linalg.solve(K, F)
        except np.linalg.LinAlgError:
            w = np.linalg.lstsq(K, F, rcond=None)[0]
        
        settlement_mm = w * 1000
        return settlement_mm, k_effective
    
    def calculate_tilt(self, settlement_mm):
        diff_settlement_mm = settlement_mm[-1] - settlement_mm[0]
        diff_settlement_m = diff_settlement_mm / 1000
        tilt_rad = np.arctan(diff_settlement_m / MAT_WIDTH_M)
        top_displacement_m = HEIGHT_M * np.tan(tilt_rad)
        top_displacement_inches = top_displacement_m / 0.0254
        return {
            'diff_settlement_mm': float(diff_settlement_mm),
            'tilt_rad': float(tilt_rad),
            'tilt_degrees': float(np.degrees(tilt_rad)),
            'top_displacement_m': float(top_displacement_m),
            'top_displacement_inches': float(top_displacement_inches),
        }
    
    def calculate_forces(self, scenario, settlement_mm):
        max_settlement = float(np.max(settlement_mm))
        min_settlement = float(np.min(settlement_mm))
        center_settlement = float(settlement_mm[len(settlement_mm)//2])
        edge_avg = float((settlement_mm[0] + settlement_mm[-1]) / 2)
        center_dish = center_settlement - edge_avg
        
        tilt = self.calculate_tilt(settlement_mm)
        P_lateral_equivalent = TOTAL_WEIGHT_KN * np.sin(tilt['tilt_rad'])
        overturning_moment = P_lateral_equivalent * HEIGHT_M / 2

        if scenario in ("hybrid", "phased", "full_phased"):
            tie_arm = BUTTRESS_HEIGHT_M
            required_tie_force = overturning_moment / tie_arm / N_BUTTRESS_PILLARS
        else:
            required_tie_force = 0
        
        return {
            'max_settlement_mm': max_settlement,
            'min_settlement_mm': min_settlement,
            'center_settlement_mm': center_settlement,
            'edge_avg_settlement_mm': edge_avg,
            'center_dish_mm': float(center_dish),
            'overturning_moment_kNm': float(overturning_moment),
            'equivalent_lateral_force_kN': float(P_lateral_equivalent),
            'required_tie_force_per_buttress_kN': float(required_tie_force),
            'required_tie_force_per_buttress_kips': float(required_tie_force / 4.448),
        }


# =============================================================================
# TOWER LATERAL MODEL
# =============================================================================
class TowerLateralModel:
    def __init__(self, n_elements=58):
        self.n = n_elements
        self.dh = HEIGHT_M / n_elements
        self.heights = np.linspace(0, HEIGHT_M, n_elements + 1)
        
    def solve_deflection(self, scenario="baseline", tilt_at_base_rad=0.005):
        h = self.heights
        n = len(h)
        
        d_tilt = h * np.tan(tilt_at_base_rad)
        d_pdelta = 0.1 * tilt_at_base_rad * (h / HEIGHT_M)**2 * HEIGHT_M
        
        if scenario == "ppu_only":
            reduction = 0.15
            d_tilt *= (1 - reduction)
            d_pdelta *= (1 - reduction)
            
        elif scenario in ("hybrid", "phased", "full_phased"):
            reduction_base = 0.15
            d_tilt *= (1 - reduction_base)
            d_pdelta *= (1 - reduction_base)
            
            tie_height_idx = int(BUTTRESS_HEIGHT_M / self.dh)
            tie_effectiveness = np.ones(n)
            for i in range(n):
                if i >= tie_height_idx:
                    progress = (i - tie_height_idx) / (n - tie_height_idx)
                    tie_effectiveness[i] = 1.0 - 0.40 * (1 - progress * 0.3)
                else:
                    tie_effectiveness[i] = 1.0 - 0.05 * (i / tie_height_idx)
            
            d_tilt *= tie_effectiveness
            d_pdelta *= tie_effectiveness
            
            if scenario in ("phased", "full_phased"):
                extraction_correction = 0.35
                d_tilt *= (1 - extraction_correction)
                d_pdelta *= (1 - extraction_correction)
            
            if scenario == "full_phased":
                # Grouting further stiffens the base — reduces residual tilt
                grout_correction = 0.25
                d_tilt *= (1 - grout_correction)
                d_pdelta *= (1 - grout_correction)
        
        total_deflection_m = d_tilt + d_pdelta
        total_deflection_inches = total_deflection_m / 0.0254
        
        return {
            'heights_m': h.tolist(),
            'heights_ft': (h / 0.3048).tolist(),
            'deflection_m': total_deflection_m.tolist(),
            'deflection_inches': total_deflection_inches.tolist(),
            'tilt_component_m': d_tilt.tolist(),
            'pdelta_component_m': d_pdelta.tolist(),
        }


# =============================================================================
# TIME-HISTORY ANALYSIS
# =============================================================================
def settlement_over_time(scenario, years_range=range(0, 31)):
    model = FoundationModel(n_elements=50)
    results = []
    for year in years_range:
        settlement_mm, _ = model.solve_settlement(scenario, years=year)
        tilt = model.calculate_tilt(settlement_mm)
        forces = model.calculate_forces(scenario, settlement_mm)
        results.append({
            'year': int(year),
            'max_settlement_mm': forces['max_settlement_mm'],
            'center_settlement_mm': forces['center_settlement_mm'],
            'center_dish_mm': forces['center_dish_mm'],
            'top_displacement_inches': tilt['top_displacement_inches'],
            'tilt_degrees': tilt['tilt_degrees'],
        })
    return results


def phased_timeline():
    """
    Years 0-17:  PPU only (as-built)
    Years 17-20: Phase 1 — buttress construction and stabilization
    Years 20-25: Phase 2 — controlled soil extraction
    Years 25-28: Phase 3 — jet grouting (lock-in)
    Years 28-35: Monitoring — long-term stability
    """
    model = FoundationModel(n_elements=50)
    results = []
    
    for year in range(0, 36):
        if year <= 17:
            # Pre-intervention
            settlement_mm, _ = model.solve_settlement("ppu_only", years=year)
            tilt = model.calculate_tilt(settlement_mm)
            forces = model.calculate_forces("ppu_only", settlement_mm)
            phase = "PPU Only"
            
        elif year <= 20:
            # Phase 1: Buttress installed
            transition = (year - 17) / 3.0
            s_ppu, _ = model.solve_settlement("ppu_only", years=year)
            s_hyb, _ = model.solve_settlement("hybrid", years=year)
            settlement_mm = s_ppu * (1 - transition) + s_hyb * transition
            tilt = model.calculate_tilt(settlement_mm)
            forces = model.calculate_forces("hybrid", settlement_mm)
            phase = "Phase 1: Stabilize"
            
        elif year <= 25:
            # Phase 2: Soil extraction
            transition = (year - 20) / 5.0
            s_hyb, _ = model.solve_settlement("hybrid", years=year)
            s_phased, _ = model.solve_settlement("phased", years=year)
            settlement_mm = s_hyb * (1 - transition) + s_phased * transition
            tilt = model.calculate_tilt(settlement_mm)
            forces = model.calculate_forces("phased", settlement_mm)
            phase = "Phase 2: Extract"
            
        elif year <= 28:
            # Phase 3: Jet grouting
            transition = (year - 25) / 3.0
            s_phased, _ = model.solve_settlement("phased", years=year)
            s_full, _ = model.solve_settlement("full_phased", years=year)
            settlement_mm = s_phased * (1 - transition) + s_full * transition
            tilt = model.calculate_tilt(settlement_mm)
            forces = model.calculate_forces("full_phased", settlement_mm)
            phase = "Phase 3: Grout"
            
        else:
            # Monitoring — full phased behavior, stable
            settlement_mm, _ = model.solve_settlement("full_phased", years=year)
            tilt = model.calculate_tilt(settlement_mm)
            forces = model.calculate_forces("full_phased", settlement_mm)
            phase = "Monitoring"
        
        results.append({
            'year': int(year),
            'phase': phase,
            'max_settlement_mm': forces['max_settlement_mm'],
            'center_settlement_mm': forces['center_settlement_mm'],
            'center_dish_mm': forces['center_dish_mm'],
            'top_displacement_inches': tilt['top_displacement_inches'],
            'tilt_degrees': tilt['tilt_degrees'],
            'diff_settlement_mm': tilt['diff_settlement_mm'],
        })
    
    return results


# =============================================================================
# RUN ALL ANALYSES
# =============================================================================
def run_full_analysis():
    print("=" * 70)
    print("MILLENNIUM TOWER - STRUCTURAL ANALYSIS")
    print("Hybrid Buttress + Pisa Method + Jet Grouting")
    print("=" * 70)
    
    foundation = FoundationModel(n_elements=50)
    tower = TowerLateralModel(n_elements=58)
    
    all_results = {}
    
    scenarios = {
        'baseline': 'Original (No Fix)',
        'ppu_only': 'Current Fix (Perimeter Piles)',
        'hybrid': 'Hybrid (Piles + Buttress Ties)',
        'phased': 'Phased (Stabilize then Extract)',
        'full_phased': 'Full Phased (Stabilize + Extract + Grout)',
    }
    
    for key, label in scenarios.items():
        print(f"\n{'─' * 55}")
        print(f"SCENARIO: {label}")
        print(f"{'─' * 55}")
        
        settlement_mm, k_eff = foundation.solve_settlement(key, years=17)
        tilt = foundation.calculate_tilt(settlement_mm)
        forces = foundation.calculate_forces(key, settlement_mm)
        
        print(f"  Max settlement:        {forces['max_settlement_mm']:.1f} mm")
        print(f"  Center settlement:     {forces['center_settlement_mm']:.1f} mm")
        print(f"  Center dishing:        {forces['center_dish_mm']:.1f} mm")
        print(f"  Top displacement:      {tilt['top_displacement_inches']:.1f} inches")
        print(f"  Tilt angle:            {tilt['tilt_degrees']:.4f} degrees")
        
        if key in ("hybrid", "phased", "full_phased"):
            print(f"  Tie force/buttress:    {forces['required_tie_force_per_buttress_kips']:,.0f} kips")
        
        base_tilt = tilt['tilt_rad']
        lateral = tower.solve_deflection(key, tilt_at_base_rad=base_tilt)
        time_history = settlement_over_time(key, range(0, 36))
        
        all_results[key] = {
            'label': label,
            'settlement_profile': {
                'x_m': foundation.x.tolist(),
                'x_ft': (foundation.x / 0.3048).tolist(),
                'settlement_mm': settlement_mm.tolist(),
            },
            'tilt': tilt,
            'forces': forces,
            'lateral_deflection': lateral,
            'time_history': time_history,
        }
    
    all_results['phased_timeline'] = phased_timeline()
    
    # Summary
    print(f"\n{'=' * 80}")
    print("COMPARISON (Year 17)")
    print(f"{'=' * 80}")
    print(f"{'Metric':<22} {'No Fix':>9} {'PPU':>9} {'Hybrid':>9} {'Phased':>9} {'Full':>9}")
    print(f"{'─' * 67}")
    for label, field, source in [
        ('Top displ. (in)', 'top_displacement_inches', 'tilt'),
        ('Center dish (mm)', 'center_dish_mm', 'forces'),
        ('Max settle. (mm)', 'max_settlement_mm', 'forces'),
        ('Tilt (deg)', 'tilt_degrees', 'tilt'),
    ]:
        vals = [all_results[s][source][field] for s in ['baseline','ppu_only','hybrid','phased','full_phased']]
        print(f"{label:<22} {vals[0]:>9.2f} {vals[1]:>9.2f} {vals[2]:>9.2f} {vals[3]:>9.2f} {vals[4]:>9.2f}")
    
    return all_results


if __name__ == "__main__":
    results = run_full_analysis()
    
    import os
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'results')
    os.makedirs(output_dir, exist_ok=True)
    
    with open(os.path.join(output_dir, 'analysis_results.json'), 'w') as f:
        json.dump(results, f, indent=2)
    
    print("\n\nResults saved to analysis/results/analysis_results.json")
