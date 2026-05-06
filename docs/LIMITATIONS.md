# Limitations

## Model Simplifications

**1D vs 3D**: Real foundation is a 2D plate on 3D soil with diagonal tilt and piles on two perpendicular sides.

**Linear soil**: Real clay consolidation is nonlinear (Cam-Clay). Pore pressure dissipation, stress-path dependency, and thixotropy not captured.

**Winkler springs**: Assumes independent soil reactions at each point. Real soil is a continuum.

**Static analysis**: No wind, seismic, or traffic vibration loads.

## Grouting-Specific Risks

**Heave**: Injecting material underground creates volume expansion that can push the surface up unpredictably. Under a 58-story tower, even millimeters of differential heave could cause structural cracking. Jet grouting sequences must be designed to avoid this — typically by grouting from the outside in and using low-pressure techniques near the mat.

**Bay Mud penetrability**: Bay Mud is fine-grained marine clay with very low permeability. Permeation grouting won't penetrate it — jet grouting works by mechanically mixing cement with soil using high-pressure jets, which is effective but creates larger disturbance zones.

**Spoil management**: Jet grouting produces spoil (mixed clay-cement slurry) at the surface that must be collected and disposed of. In a dense urban site, spoil management adds logistical complexity.

**Interaction with existing piles**: The original 80-ft friction piles and the 18 PPU bedrock piles create obstructions. Grout columns must be threaded between existing piles, which constrains placement geometry.

**Heat of hydration**: Cement curing generates heat. Dense grouting under a mat foundation could create thermal gradients that induce temporary differential settlement. Curing sequences need thermal management.

## Scale Precedent Gap

Pisa weighs ~14,500 metric tons. Millennium Tower weighs ~150,000 metric tons — 10x heavier. Extraction volumes and grouting coverage must scale accordingly, with much tighter tolerances. The Pisa correction took 10 years.

Jet grouting has been used on foundations of comparable weight (dams, power plants) but not in combination with post-correction soil extraction at this scale.

## Unmodeled Practical Constraints

**Urban context**: Buttress pillars occupy street space. Grouting requires surface drill rigs. Adjacent Salesforce Transit Center and transit infrastructure constrain access.

**Cost**: PPU was $120M. Three-phase program likely $150-350M depending on grouting scope. No cost-benefit analysis provided.

**Duration**: Full three-phase program spans ~11 years (yr 17-28). Building occupants must tolerate construction for over a decade.

**Regulatory**: Above-ground buttresses in the public right-of-way. Subsurface grouting permits. Environmental review for cement injection into Bay Mud.

## What This Model Demonstrates

Despite limitations:

1. The three-phase sequence is structurally logical and each component is proven in isolation
2. Grouting eliminates the tidal pumping mechanism that drives ongoing settlement (99% creep reduction)
3. Required forces are within standard engineering practice (275 kips/buttress)
4. The phased approach provides built-in checkpoints — each phase can be evaluated before proceeding

## Next Steps

1. 3D FEM (PLAXIS 3D / ABAQUS) with Cam-Clay constitutive model
2. Grouting heave analysis — predict and manage volume changes
3. Thermal analysis — heat of hydration effects during curing
4. Seismic analysis — response spectrum for buttress and tie connections
5. Pilot grouting test — small-area trial to calibrate injection parameters for Bay Mud
6. Cost-benefit analysis vs alternatives (additional piles, load reduction, building replacement)
7. Peer review by licensed structural and geotechnical engineers
