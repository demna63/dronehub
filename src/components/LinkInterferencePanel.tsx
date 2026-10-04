import React, { useMemo, useState } from 'react';
import { Antenna, Glasses, Radio, Satellite, Ruler, SlidersHorizontal, ShieldAlert } from 'lucide-react';
import { VTX_ALL_BANDS } from '../constants/toolsData';
import { useLanguage } from '../contexts/useLanguage';
import {
  analyzeLinks, formatTerms, mwToDbm, noiseFloorDbm,
  type Emitter, type Finding, type Severity, type Victim, type VictimId,
} from '../utils/rfInterference';

interface Props {
  /** Control link centre and width come from the calculator's main inputs. */
  txFreq: number;
  txBw: number;
}

const MAX_ROWS = 25;

const SEVERITY_STYLE: Record<Severity, string> = {
  critical: 'bg-rose-500/20 text-rose-200 border-rose-500/40',
  warning: 'bg-amber-500/15 text-amber-200 border-amber-500/30',
  marginal: 'bg-sky-500/10 text-sky-200 border-sky-500/20',
  ok: 'bg-emerald-500/10 text-emerald-200 border-emerald-500/20',
};

const SEVERITY_RANK: Record<Severity, number> = { critical: 3, warning: 2, marginal: 1, ok: 0 };

const VTX_OPTIONS = VTX_ALL_BANDS.flatMap((b) => b.channels.map((c) => ({ label: `${c.name} · ${c.freq}`, freq: c.freq })));

const dbm = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}`;

interface FieldProps {
  id: string;
  label: string;
  unit: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}

const Field: React.FC<FieldProps> = ({ id, label, unit, value, onChange, step }) => (
  <label htmlFor={id} className="block space-y-1">
    <span className="text-[11px] font-bold text-ink-3">{label}</span>
    <div className="flex items-center bg-surface border border-white/10 rounded-lg focus-within:border-rose-500">
      <input
        id={id}
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : ''}
        onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))}
        className="w-full min-w-0 bg-transparent px-3 py-2 text-sm text-white font-mono focus:outline-none"
      />
      <span className="pr-3 text-[11px] text-ink-3 font-mono whitespace-nowrap">{unit}</span>
    </div>
  </label>
);

interface CardProps {
  icon: React.ReactNode;
  title: string;
  hint: string;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ icon, title, hint, children }) => (
  <div className="bg-bg/50 border border-white/10 rounded-2xl p-4 space-y-3">
    <div className="flex items-start gap-2">
      <span className="text-rose-400 mt-0.5">{icon}</span>
      <div>
        <h4 className="text-sm font-extrabold text-white">{title}</h4>
        <p className="text-[11px] text-ink-3">{hint}</p>
      </div>
    </div>
    <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-3">{children}</div>
  </div>
);

const LinkInterferencePanel: React.FC<Props> = ({ txFreq, txBw }) => {
  const { t } = useLanguage();

  const [txMw, setTxMw] = useState(250);
  const [vtxFreq, setVtxFreq] = useState(5800);
  const [vtxBw, setVtxBw] = useState(20);
  const [vtxMw, setVtxMw] = useState(400);

  const [rxIip3, setRxIip3] = useState(-10);
  const [rxNf, setRxNf] = useState(6);
  const [rxNoiseBw, setRxNoiseBw] = useState(0.5);
  const [rxRej, setRxRej] = useState(30);

  const [vrxIip3, setVrxIip3] = useState(-15);
  const [vrxNf, setVrxNf] = useState(8);
  const [vrxNoiseBw, setVrxNoiseBw] = useState(20);
  const [vrxRej, setVrxRej] = useState(20);

  const [pilotM, setPilotM] = useState(0.5);
  const [droneM, setDroneM] = useState(200);
  const [onboardCm, setOnboardCm] = useState(5);
  const [suppression, setSuppression] = useState(40);
  const [maxOrder, setMaxOrder] = useState(5);

  const values = [txFreq, txBw, txMw, vtxFreq, vtxBw, vtxMw, rxNf, rxNoiseBw, vrxNf, vrxNoiseBw, pilotM, droneM, onboardCm];
  const valid = values.every((v) => Number.isFinite(v) && v > 0)
    && [rxIip3, rxRej, vrxIip3, vrxRej, suppression].every(Number.isFinite)
    && txBw < txFreq * 2 && vtxBw < vtxFreq * 2;

  const victims = useMemo<Victim[]>(() => [
    { id: 'rx', freq: txFreq, bw: txBw, noiseBw: rxNoiseBw, iip3Dbm: rxIip3, nfDb: rxNf, rejectionDb: rxRej },
    { id: 'vrx', freq: vtxFreq, bw: vtxBw, noiseBw: vrxNoiseBw, iip3Dbm: vrxIip3, nfDb: vrxNf, rejectionDb: vrxRej },
  ], [txFreq, txBw, rxNoiseBw, rxIip3, rxNf, rxRej, vtxFreq, vtxBw, vrxNoiseBw, vrxIip3, vrxNf, vrxRej]);

  const findings = useMemo<Finding[]>(() => {
    if (!valid) return [];
    const emitters: Emitter[] = [
      { id: 'tx', freq: txFreq, bw: txBw, powerDbm: mwToDbm(txMw) },
      { id: 'vtx', freq: vtxFreq, bw: vtxBw, powerDbm: mwToDbm(vtxMw) },
    ];
    return analyzeLinks(emitters, victims, { pilotM, droneM, onboardM: onboardCm / 100 }, {
      harmonicSuppressionDb: suppression,
      maxIntermodOrder: maxOrder,
    });
  }, [valid, txFreq, txBw, txMw, vtxFreq, vtxBw, vtxMw, victims, pilotM, droneM, onboardCm, suppression, maxOrder]);

  const shown = findings.filter((f) => f.severity !== 'ok');
  const names = { tx: 'TX', vtx: 'VTX' } as const;
  const victimName = (v: VictimId) => (v === 'rx' ? t('link_rx') : t('link_vrx'));

  const worst = (v: VictimId): Severity =>
    shown.filter((f) => f.victim === v).reduce<Severity>((w, f) => (SEVERITY_RANK[f.severity] > SEVERITY_RANK[w] ? f.severity : w), 'ok');

  return (
    <section className="space-y-6" aria-labelledby="link-title">
      <div className="flex items-center gap-2 pb-2 border-b border-white/10">
        <ShieldAlert className="text-rose-400" size={18} />
        <h3 id="link-title" className="text-sm font-extrabold text-white">{t('link_title')}</h3>
      </div>
      <p className="text-xs text-ink-3 -mt-3">{t('link_subtitle')}</p>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
        <Card icon={<Radio size={16} />} title={t('link_tx')} hint={t('link_tx_hint', { freq: txFreq, bw: txBw })}>
          <Field id="tx-mw" label={t('link_power')} unit="mW" value={txMw} onChange={setTxMw} />
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-ink-3">{t('link_power')}</span>
            <div className="px-3 py-2 text-sm font-mono text-ink-2">{Number.isFinite(txMw) && txMw > 0 ? dbm(mwToDbm(txMw)) : '—'} dBm</div>
          </div>
        </Card>

        <Card icon={<Satellite size={16} />} title={t('link_vtx')} hint={t('link_vtx_hint')}>
          <label htmlFor="vtx-ch" className="col-span-full block space-y-1">
            <span className="text-[11px] font-bold text-ink-3">{t('link_channel')}</span>
            <select
              id="vtx-ch"
              value={VTX_OPTIONS.some((o) => o.freq === vtxFreq) ? vtxFreq : ''}
              onChange={(e) => setVtxFreq(Number(e.target.value))}
              className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-rose-500"
            >
              <option value="" disabled>{t('link_custom')}</option>
              {VTX_OPTIONS.map((o) => <option key={o.label} value={o.freq}>{o.label}</option>)}
            </select>
          </label>
          <Field id="vtx-freq" label={t('link_freq')} unit="MHz" value={vtxFreq} onChange={setVtxFreq} />
          <Field id="vtx-bw" label={t('link_bw')} unit="MHz" value={vtxBw} onChange={setVtxBw} />
          <Field id="vtx-mw" label={t('link_power')} unit="mW" value={vtxMw} onChange={setVtxMw} />
        </Card>

        <Card icon={<Antenna size={16} />} title={t('link_rx')} hint={t('link_rx_hint')}>
          <Field id="rx-iip3" label="IIP3" unit="dBm" value={rxIip3} onChange={setRxIip3} />
          <Field id="rx-nf" label="NF" unit="dB" value={rxNf} onChange={setRxNf} step={0.5} />
          <Field id="rx-nbw" label={t('link_noise_bw')} unit="MHz" value={rxNoiseBw} onChange={setRxNoiseBw} step={0.1} />
          <Field id="rx-rej" label={t('link_rejection')} unit="dB" value={rxRej} onChange={setRxRej} />
        </Card>

        <Card icon={<Glasses size={16} />} title={t('link_vrx')} hint={t('link_vrx_hint')}>
          <Field id="vrx-iip3" label="IIP3" unit="dBm" value={vrxIip3} onChange={setVrxIip3} />
          <Field id="vrx-nf" label="NF" unit="dB" value={vrxNf} onChange={setVrxNf} step={0.5} />
          <Field id="vrx-nbw" label={t('link_noise_bw')} unit="MHz" value={vrxNoiseBw} onChange={setVrxNoiseBw} />
          <Field id="vrx-rej" label={t('link_rejection')} unit="dB" value={vrxRej} onChange={setVrxRej} />
        </Card>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
        <Card icon={<Ruler size={16} />} title={t('link_geometry')} hint={t('link_geometry_hint')}>
          <Field id="geo-pilot" label={t('link_pilot_m')} unit="m" value={pilotM} onChange={setPilotM} step={0.1} />
          <Field id="geo-drone" label={t('link_drone_m')} unit="m" value={droneM} onChange={setDroneM} />
          <Field id="geo-onboard" label={t('link_onboard_cm')} unit="cm" value={onboardCm} onChange={setOnboardCm} />
        </Card>
        <Card icon={<SlidersHorizontal size={16} />} title={t('link_model')} hint={t('link_model_hint')}>
          <Field id="opt-supp" label={t('link_suppression')} unit="dBc" value={suppression} onChange={setSuppression} />
          <label htmlFor="opt-order" className="block space-y-1">
            <span className="text-[11px] font-bold text-ink-3">{t('link_max_order')}</span>
            <select
              id="opt-order"
              value={maxOrder}
              onChange={(e) => setMaxOrder(Number(e.target.value))}
              className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-rose-500"
            >
              {[2, 3, 4, 5].map((k) => <option key={k} value={k}>IM{k}</option>)}
            </select>
          </label>
        </Card>
      </div>

      {!valid ? (
        <div role="alert" className="p-6 text-center text-amber-300 text-xs bg-amber-500/5 rounded-[10px] border border-amber-500/20">
          {t('link_invalid')}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {victims.map((v) => {
              const w = worst(v.id);
              return (
                <div key={v.id} className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-3 ${SEVERITY_STYLE[w]}`}>
                  <div>
                    <div className="text-sm font-extrabold">{victimName(v.id)} · {v.freq} MHz</div>
                    <div className="text-[11px] opacity-80 font-mono">
                      {t('link_noise_floor')}: {dbm(noiseFloorDbm(v.noiseBw ?? v.bw, v.nfDb))} dBm
                    </div>
                  </div>
                  <span className="text-xs font-extrabold whitespace-nowrap">{t(`link_sev_${w}`)}</span>
                </div>
              );
            })}
          </div>

          {shown.length === 0 ? (
            <div className="p-6 text-center text-ink-3 text-xs bg-bg/30 rounded-[10px] border border-white/5">{t('link_none')}</div>
          ) : (
            <div className="bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-xs font-extrabold text-ink-3 bg-white/[0.02]">
                    <tr>
                      <th className="p-3">{t('link_col_severity')}</th>
                      <th className="p-3">{t('link_col_victim')}</th>
                      <th className="p-3">{t('link_col_product')}</th>
                      <th className="p-3">{t('link_col_freq')}</th>
                      <th className="p-3">{t('link_col_level')}</th>
                      <th className="p-3">{t('link_col_margin')}</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-mono text-ink-2 divide-y divide-white/5">
                    {shown.slice(0, MAX_ROWS).map((f) => (
                      <tr key={`${f.victim}-${f.mechanism}-${f.terms.map((x) => `${x.emitter}${x.m}`).join('')}`}>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-md border text-[11px] font-extrabold ${SEVERITY_STYLE[f.severity]}`}>
                            {t(`link_sev_${f.severity}`)}
                          </span>
                        </td>
                        <td className="p-3 text-white">{victimName(f.victim)}</td>
                        <td className="p-3">
                          <span className="text-white">{formatTerms(f.terms, names)}</span>
                          <span className="block text-[11px] text-ink-3">
                            {f.mechanism === 'harmonic' ? t('link_harmonic', { n: f.order }) : t('link_intermod', { k: f.order })}
                          </span>
                        </td>
                        <td className="p-3">{f.freq.toFixed(1)} <span className="text-ink-3">±{(f.bw / 2).toFixed(1)}</span></td>
                        <td className="p-3">{dbm(f.levelDbm)} dBm</td>
                        <td className="p-3 font-bold text-white">{dbm(f.marginDb)} dB</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {shown.length > MAX_ROWS && (
                <p className="p-3 text-[11px] text-ink-3 border-t border-white/5">{t('link_more', { count: shown.length - MAX_ROWS })}</p>
              )}
            </div>
          )}
        </>
      )}

      <details className="text-xs text-ink-3 bg-bg/30 border border-white/5 rounded-[10px] p-4">
        <summary className="cursor-pointer font-bold text-ink-2">{t('link_method_title')}</summary>
        <ul className="mt-3 space-y-1.5 list-disc pl-5 font-mono">
          <li>{t('link_method_series')}</li>
          <li>{t('link_method_products')}</li>
          <li>{t('link_method_level')}</li>
          <li>{t('link_method_harmonic')}</li>
          <li>{t('link_method_noise')}</li>
          <li>{t('link_method_caveat')}</li>
        </ul>
      </details>
    </section>
  );
};

export default LinkInterferencePanel;
