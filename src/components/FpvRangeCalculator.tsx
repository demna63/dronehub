import React, { useState, useMemo } from 'react';
import { Crosshair, Info, Zap } from 'lucide-react';
import { useLanguage } from '../contexts/useLanguage';

/**
 * FPV Range Calculator — Friis Transmission Equation
 *
 * TX power (dBm) = 10 · log10(P_mW)
 * Max path loss  = TX_dBm + G_tx + G_rx − S_rx − L_extra
 * Theoretical d  = 10^((PL − 20·log10(f_MHz) − 32.44) / 20)   [km]
 * Realistic est.  ≈ d / π  (≈ 31.8 % of theoretical)
 */

interface InputFieldProps {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
  unit?: string;
  step?: number | string;
}

const InputField: React.FC<InputFieldProps> = ({ id, label, value, onChange, hint, unit, step }) => (
  <div className="space-y-2">
    <label htmlFor={id} className="text-xs text-ink-3 font-bold ml-1">
      {label} {unit && <span className="text-ink-3/60 font-normal">({unit})</span>}
    </label>
    <div className="relative group">
      <input
        id={id}
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-surface border border-white/10 rounded-[10px] px-4 py-3 text-sm text-white focus:outline-none focus:border-accent font-mono transition-colors group-hover:bg-surface-2"
      />
    </div>
    {hint && <p className="text-xs text-ink-3 ml-1">{hint}</p>}
  </div>
);

interface ResultRowProps {
  label: string;
  value: string;
  unit: string;
  highlight?: boolean;
}

const ResultRow: React.FC<ResultRowProps> = ({ label, value, unit, highlight }) => (
  <div
    className={`flex items-center justify-between rounded-xl px-5 py-4 ${
      highlight
        ? 'bg-accent-tint border border-accent/30'
        : 'bg-bg/50 border border-white/10'
    }`}
  >
    <span className={`text-sm font-semibold ${highlight ? 'text-accent' : 'text-ink-2'}`}>
      {label}
    </span>
    <span className="flex items-baseline gap-1">
      <span className={`text-2xl font-extrabold font-mono ${highlight ? 'text-accent' : 'text-white'}`}>
        {value}
      </span>
      <span className={`text-xs ${highlight ? 'text-accent/70' : 'text-ink-3'}`}>{unit}</span>
    </span>
  </div>
);

const FpvRangeCalculator: React.FC = () => {
  const { t } = useLanguage();

  // --- STATE (defaults match reference screenshot) ---
  const [vtxPower, setVtxPower] = useState(5000);       // mW
  const [vtxGain, setVtxGain] = useState(2.1);           // dBi
  const [vrxGain, setVrxGain] = useState(14);             // dBi
  const [vrxSensitivity, setVrxSensitivity] = useState(-99); // dBm
  const [extraLoss, setExtraLoss] = useState(1.5);        // dB
  const [frequency, setFrequency] = useState(7200);       // MHz

  // --- CALCULATIONS ---
  const results = useMemo(() => {
    if (!vtxPower || !frequency) {
      return { txPower: 0, maxPathLoss: 0, theoreticalKm: 0, realisticKm: 0 };
    }

    // TX power in dBm
    const txPower = 10 * Math.log10(vtxPower);

    // Max path loss (link budget)
    const maxPathLoss = txPower + vtxGain + vrxGain - vrxSensitivity - extraLoss;

    // Friis free-space path loss → distance
    // FSPL(dB) = 20·log10(d_km) + 20·log10(f_MHz) + 32.44
    // => d_km = 10^((PL - 20·log10(f_MHz) - 32.44) / 20)
    const theoreticalKm = Math.pow(10, (maxPathLoss - 20 * Math.log10(frequency) - 32.44) / 20);

    // Realistic estimate ≈ theoretical / π
    const realisticKm = theoreticalKm / Math.PI;

    return {
      txPower: Math.round(txPower * 10) / 10,
      maxPathLoss: Math.round(maxPathLoss * 10) / 10,
      theoreticalKm: Math.round(theoreticalKm * 10) / 10,
      realisticKm: Math.round(realisticKm * 10) / 10,
    };
  }, [vtxPower, vtxGain, vrxGain, vrxSensitivity, extraLoss, frequency]);

  return (
    <div className="p-6 space-y-8 duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-white/10 pb-6">
        <div className="p-3 bg-accent-tint rounded-2xl text-accent border border-accent/20">
          <Crosshair size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-white">
            {t('range_title') || 'FPV Range Calculator'}
          </h2>
          <p className="text-sm text-ink-3 font-medium">
            {t('range_subtitle') || 'Estimate the maximum range of your FPV system based on the link budget'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Inputs */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-bg/50 border border-white/10 rounded-2xl p-5 space-y-5">
            <h3 className="text-xs font-extrabold text-ink-3 mb-4 flex items-center gap-2">
              <Zap size={14} /> {t('range_params') || 'Link Parameters'}
            </h3>

            <InputField
              id="vtx-power"
              label={t('range_vtx_power') || 'VTX Power'}
              unit="mW"
              value={vtxPower}
              onChange={setVtxPower}
              hint={t('range_vtx_power_hint') || '25, 200, 800, 1600, 5000…'}
            />

            <InputField
              id="vtx-gain"
              label={t('range_vtx_gain') || 'VTX Antenna Gain'}
              unit="dBi"
              value={vtxGain}
              onChange={setVtxGain}
              step={0.1}
              hint={t('range_vtx_gain_hint') || 'Omni ≈ 2 dBi, Patch ≈ 8–14 dBi'}
            />

            <InputField
              id="vrx-gain"
              label={t('range_vrx_gain') || 'VRX Antenna Gain'}
              unit="dBi"
              value={vrxGain}
              onChange={setVrxGain}
              step={0.1}
              hint={t('range_vrx_gain_hint') || 'Crosshair ≈ 10, Patch ≈ 14 dBi'}
            />

            <InputField
              id="vrx-sensitivity"
              label={t('range_vrx_sens') || 'VRX Sensitivity'}
              unit="dBm"
              value={vrxSensitivity}
              onChange={setVrxSensitivity}
              hint={t('range_vrx_sens_hint') || 'Typical: −90 to −105 dBm'}
            />

            <InputField
              id="extra-loss"
              label={t('range_extra_loss') || 'Extra Loss'}
              unit="dB"
              value={extraLoss}
              onChange={setExtraLoss}
              step={0.1}
              hint={t('range_extra_loss_hint') || 'Cables, connectors, etc.'}
            />

            <InputField
              id="range-frequency"
              label={t('range_frequency') || 'Frequency'}
              unit="MHz"
              value={frequency}
              onChange={setFrequency}
              hint={t('range_freq_hint') || '900, 1300, 2400, 5800, 7200…'}
            />
          </div>

          {/* Info Box */}
          <div className="bg-accent-tint border border-accent/30 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <Info className="text-accent flex-shrink-0 mt-0.5" size={16} />
              <p className="text-xs text-accent leading-relaxed">
                <strong className="text-accent block mb-1">
                  {t('range_info_title') || 'Friis Transmission Equation'}
                </strong>
                {t('range_info_desc') || 'This calculator uses the Friis free-space path loss model. The realistic estimate accounts for environmental factors (terrain, reflections, interference) and is approximately 1/π of the theoretical maximum.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-2 space-y-4">
          <ResultRow
            label={t('range_tx_power') || 'TX Power'}
            value={results.txPower.toFixed(1)}
            unit="dBm"
          />
          <ResultRow
            label={t('range_max_path_loss') || 'Max Path Loss'}
            value={results.maxPathLoss.toFixed(1)}
            unit="dB"
          />
          <ResultRow
            label={t('range_theoretical') || 'Theoretical Max Distance'}
            value={results.theoreticalKm.toFixed(1)}
            unit="km"
          />
          <ResultRow
            label={t('range_realistic') || 'Realistic Estimate'}
            value={results.realisticKm.toFixed(1)}
            unit="km"
            highlight
          />

          {/* Formula explanation */}
          <div className="bg-[#0d1117] border border-white/10 rounded-2xl p-6 mt-4 space-y-4">
            <h4 className="text-xs font-extrabold text-ink-3">
              {t('range_formula_title') || 'How it works'}
            </h4>
            <div className="space-y-3 font-mono text-xs text-ink-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="text-ink-3 min-w-[140px]">TX Power</span>
                <span className="text-white">= 10 · log₁₀({vtxPower}) = <span className="text-accent">{results.txPower}</span> dBm</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="text-ink-3 min-w-[140px]">Max Path Loss</span>
                <span className="text-white">= {results.txPower} + {vtxGain} + {vrxGain} − ({vrxSensitivity}) − {extraLoss} = <span className="text-accent">{results.maxPathLoss}</span> dB</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="text-ink-3 min-w-[140px]">FSPL → Distance</span>
                <span className="text-white">= 10^(({results.maxPathLoss} − 20·log₁₀({frequency}) − 32.44) / 20) = <span className="text-accent">{results.theoreticalKm}</span> km</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="text-ink-3 min-w-[140px]">{t('range_realistic') || 'Realistic'}</span>
                <span className="text-white">≈ {results.theoreticalKm} / π = <span className="text-accent font-bold">{results.realisticKm}</span> km</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FpvRangeCalculator;
