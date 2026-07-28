import React from "react";
import { THEME } from "../constants";

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Public+Sans:wght@400;600;700;800&display=swap');
      :root {
        --display: 'Oswald', 'Arial Narrow', sans-serif;
        --body: 'Public Sans', -apple-system, 'Segoe UI', sans-serif;
      }
      * { box-sizing: border-box; }
      button { font-family: var(--body); }
      button:focus-visible, [tabindex]:focus-visible, input:focus-visible, textarea:focus-visible {
        outline: 2px solid ${THEME.sky}; outline-offset: 2px;
      }
      .screen { flex: 1; }
      .section-title { font-family: var(--display); font-weight: 600; font-size: 17px; color: ${THEME.grayLight}; margin: 22px 0 10px; }
      .grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px 12px; }
      .cell { background: transparent; border: none; padding: 0; cursor: pointer; display: flex; flex-direction: column; gap: 5px; align-items: flex-start; }
      .thumb { width: 100%; aspect-ratio: 1; border-radius: 6px; overflow: hidden; }
      .cell-name { color: ${THEME.grayLight}; font-size: 11px; font-weight: 600; text-align: left; line-height: 1.25; }
      .row-card { display: flex; gap: 12px; align-items: center; background: ${THEME.surface}; border: none; border-radius: 16px; padding: 12px 14px; cursor: pointer; width: 100%; }
      .rank-card { display: flex; gap: 12px; align-items: center; background: ${THEME.surface}; border-radius: 16px; padding: 12px 14px; }
      .spotlight-card { position: relative; width: 100%; min-height: 200px; border: none; border-radius: 18px; overflow: hidden; cursor: pointer; padding: 0; margin-bottom: 20px; text-align: left; }
      .rank-num { font-family: var(--display); font-weight: 700; font-size: 26px; color: ${THEME.slateMid}; width: 26px; text-align: center; flex-shrink: 0; }
      .review-card { background: ${THEME.surface}; border-radius: 16px; padding: 14px 16px; }
      .round-btn { width: 38px; height: 38px; border-radius: 50%; background: ${THEME.surfaceHi}; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .list-row { display: flex; gap: 14px; align-items: center; width: 100%; background: transparent; border: none; border-bottom: 1px solid ${THEME.hairline}; padding: 15px 2px; cursor: pointer; }
      .mini-btn { background: ${THEME.surfaceHi}; border: none; border-radius: 8px; padding: 5px; cursor: pointer; color: ${THEME.grayLight}; display: flex; }
      .mini-btn:hover:not(:disabled) { background: rgba(255,255,255,0.2); }
      .mini-btn:disabled { opacity: 0.3; cursor: default; }
      .tiny-btn { background: ${THEME.surfaceHi}; border: none; border-radius: 14px; padding: 4px 9px; font-size: 11px; font-weight: 600; color: ${THEME.grayLight}; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
      .tiny-btn:hover { background: rgba(255,255,255,0.18); }
      .tiny-note { color: ${THEME.textDim}; font-size: 11px; align-self: center; }
      .chip { border: none; border-radius: 18px; padding: 8px 14px; font-size: 12.5px; font-weight: 600; color: ${THEME.grayLight}; cursor: pointer; }
      .chip:disabled { cursor: default; }
      .follow-btn { display: inline-flex; align-items: center; gap: 5px; background: ${THEME.slateMid}; color: #fff; border: none; border-radius: 16px; padding: 7px 12px; font-size: 12px; font-weight: 700; cursor: pointer; flex-shrink: 0; }
      .field { width: 100%; border: none; border-radius: 12px; padding: 11px 13px; font-size: 14px; margin-bottom: 12px; background: ${THEME.grayLight}; color: ${THEME.ink}; font-family: var(--body); outline: none; }
      .field::placeholder { color: ${THEME.gray}; }
      .field:focus { box-shadow: 0 0 0 2px ${THEME.slateMid}; }
      .field-label { display: block; color: ${THEME.gray}; font-size: 12px; font-weight: 600; letter-spacing: 0.4px; margin-bottom: 5px; width: 100%; }
      .primary-btn { width: 100%; border: none; border-radius: 24px; padding: 13px; background: ${THEME.slateMid}; color: #fff; font-weight: 700; font-size: 15px; cursor: pointer; }
      .primary-btn:disabled { opacity: 0.45; cursor: default; }
      .primary-btn:not(:disabled):hover { background: ${THEME.slate}; }
      .outline-btn { width: 100%; border: 1.5px solid rgba(255,255,255,0.5); border-radius: 24px; padding: 11px; background: transparent; color: ${THEME.grayLight}; font-weight: 600; font-size: 14px; cursor: pointer; }
      .ghost-btn { background: transparent; border: none; color: ${THEME.sky}; font-size: 14px; font-weight: 600; cursor: pointer; padding: 4px; }
      .oauth-btn { width: 100%; border: none; border-radius: 24px; padding: 12px; background: #fff; color: #1a1a1a; font-weight: 600; font-size: 14.5px; cursor: pointer; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; }
      .icon-inline { position: absolute; right: 12px; top: 10px; background: transparent; border: none; color: ${THEME.gray}; cursor: pointer; }
      .gear-slot { border: none; border-radius: 16px; aspect-ratio: 1.15; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; padding: 6px; transition: transform 0.1s; }
      .gear-slot:active { transform: scale(0.96); }
      .gear-tag { display: inline-flex; align-items: center; gap: 4px; background: ${THEME.slateDeep}; color: ${THEME.mintLight}; font-size: 9.5px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; border-radius: 8px; padding: 3px 8px; }
      .hit { position: absolute; top: 0; width: 50%; height: 100%; background: transparent; border: none; padding: 0; cursor: pointer; }
      .stat-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; background: ${THEME.surface}; border-radius: 14px; padding: 12px 10px; margin-top: 14px; text-align: center; }
      .stat-n { font-family: var(--display); font-weight: 700; font-size: 17px; color: ${THEME.grayLight}; }
      .stat-l { color: ${THEME.textDim}; font-size: 10.5px; letter-spacing: 0.4px; }
      .record { background: ${THEME.surface}; border-radius: 18px; padding: 14px 16px; margin-top: 16px; }
      .record-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; text-align: center; }
      .badge { display: inline-flex; align-items: center; gap: 5px; background: ${THEME.slateDeep}; color: ${THEME.mintLight}; font-size: 11px; font-weight: 700; border-radius: 12px; padding: 5px 9px; }
      .rarity { display: flex; align-items: center; gap: 7px; border-radius: 12px; padding: 9px 12px; margin-top: 12px; font-size: 12.5px; font-weight: 600; }
      .rarity.rare, .rarity.unlogged { background: rgba(202,224,206,0.14); color: ${THEME.mintLight}; }
      .rarity.uncommon { background: rgba(90,124,146,0.22); color: ${THEME.skyLight}; }
      .rarity.common { background: ${THEME.surface}; color: ${THEME.textDim}; }
      .first-flag { position: absolute; top: 5px; left: 5px; display: inline-flex; align-items: center; gap: 3px; background: rgba(0,0,0,0.6); color: ${THEME.mintLight}; font-size: 9px; font-weight: 700; border-radius: 6px; padding: 2px 5px; }
      .rare-flag { position: absolute; top: 5px; left: 5px; display: inline-flex; align-items: center; gap: 3px; background: rgba(0,0,0,0.6); color: ${THEME.mintLight}; font-size: 9px; font-weight: 700; letter-spacing: 0.4px; border-radius: 6px; padding: 2px 5px; text-transform: uppercase; }
      .rare-dot { position: absolute; top: 3px; right: 3px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: rgba(0,0,0,0.6); color: ${THEME.mintLight}; }
      .photo-tag { position: absolute; bottom: 6px; left: 6px; background: rgba(0,0,0,0.6); color: ${THEME.mintLight}; font-size: 9.5px; font-weight: 700; border-radius: 6px; padding: 2px 6px; }
      .photo-add { width: 66px; height: 66px; border-radius: 10px; border: 1.5px dashed rgba(255,255,255,0.25); background: transparent; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; }
      .prior-note { display: flex; gap: 8px; align-items: flex-start; background: ${THEME.surfaceHi}; border-radius: 12px; padding: 10px 12px; color: ${THEME.gray}; font-size: 12px; line-height: 1.45; margin-bottom: 14px; }
      .prior-note svg { flex-shrink: 0; margin-top: 2px; color: ${THEME.mintLight}; }
      .link-note { border: 1px solid ${THEME.hairline}; border-radius: 12px; padding: 10px 12px; margin-bottom: 12px; }
      .looking-for { display: flex; gap: 8px; align-items: flex-start; background: ${THEME.surfaceHi}; border-radius: 12px; padding: 10px 12px; color: ${THEME.grayLight}; font-size: 13px; line-height: 1.45; margin-top: 4px; }
      .looking-for svg { flex-shrink: 0; margin-top: 2px; color: ${THEME.mintLight}; }
      .sold-veil { position: absolute; inset: 0; background: rgba(12,21,26,0.6); display: flex; align-items: center; justify-content: center; }
      .sold-veil span { font-family: var(--display); font-size: 20px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: ${THEME.grayLight}; border: 2px solid ${THEME.grayLight}; border-radius: 6px; padding: 2px 10px; transform: rotate(-8deg); }
      .kind-flag { position: absolute; bottom: 8px; left: 8px; display: inline-flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.6); color: ${THEME.mintLight}; font-size: 10px; font-weight: 700; border-radius: 6px; padding: 3px 6px; }
      .dot { position: absolute; top: -2px; right: -2px; min-width: 16px; height: 16px; border-radius: 8px; background: ${THEME.slateMid}; color: #fff; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; padding: 0 4px; }
      .menu-scrim { position: fixed; inset: 0; z-index: 9; }
      .menu { position: absolute; top: 44px; z-index: 10; background: ${THEME.surfaceHi}; border: 1px solid ${THEME.hairline}; border-radius: 14px; padding: 6px; min-width: 170px; box-shadow: 0 12px 30px rgba(0,0,0,0.5); }
      .menu-item { display: flex; justify-content: space-between; align-items: center; gap: 10px; width: 100%; background: transparent; border: none; border-radius: 9px; padding: 9px 10px; font-size: 13px; font-weight: 600; cursor: pointer; text-align: left; }
      .menu-item:hover { background: rgba(255,255,255,0.08); }
      .poi-prompt-scrim { position: absolute; inset: 0; z-index: 30; background: rgba(12,21,26,0.55); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 20px; }
      .poi-prompt { position: relative; width: min(300px, 100%); background: ${THEME.slateMid}; border-radius: 22px; box-shadow: 0 20px 60px rgba(0,0,0,0.6); padding: 20px 18px 18px; display: flex; flex-direction: column; animation: slideUp 0.2s ease; }
      .poi-prompt-title { color: #fff; font-family: var(--display); font-size: 17px; font-weight: 600; margin-bottom: 12px; }
      .poi-prompt-input { width: 100%; min-height: 120px; resize: none; border: none; background: rgba(255,255,255,0.14); border-radius: 14px; color: #fff; font-size: 14.5px; font-family: var(--body); padding: 13px; outline: none; margin-bottom: 12px; }
      .poi-prompt-input::placeholder { color: rgba(255,255,255,0.68); }
      .poi-prompt-close { position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.25); border: none; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; color: #fff; cursor: pointer; z-index: 2; }
      .poi-map-corner { position: relative; width: 76px; height: 76px; border-radius: 14px; overflow: hidden; border: 2px solid rgba(255,255,255,0.5); box-shadow: 0 6px 16px rgba(0,0,0,0.35); transition: width 0.22s ease, height 0.22s ease; }
      .poi-map-corner.open { width: 100%; height: 180px; }
      .poi-map-toggle { position: absolute; top: 4px; left: 4px; background: rgba(12,21,26,0.75); border: none; border-radius: 6px; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; color: #fff; cursor: pointer; z-index: 4; }
      .poi-prompt-send { margin-top: 14px; width: 100%; border: none; border-radius: 22px; padding: 12px; background: rgba(255,255,255,0.2); color: #fff; font-weight: 700; font-size: 14.5px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
      .poi-prompt-send:disabled { opacity: 0.4; cursor: default; }
      @media (prefers-reduced-motion: reduce) { .poi-prompt { animation: none; } }
      .ledger { background: ${THEME.surface}; border-radius: 14px; padding: 12px 14px; margin-top: 14px; }
      .ledger-row { display: flex; gap: 10px; align-items: center; color: ${THEME.grayLight}; font-size: 12.5px; padding: 4px 0; }
      .thread-head { background: ${THEME.surface}; border-radius: 12px; padding: 10px 12px; font-size: 12.5px; }
      .bubble { max-width: 78%; border-radius: 16px; padding: 9px 13px; font-size: 13.5px; line-height: 1.4; white-space: pre-wrap; word-break: break-word; }
      .bubble.mine { align-self: flex-end; background: ${THEME.slateMid}; color: #fff; border-bottom-right-radius: 5px; }
      .bubble.theirs { align-self: flex-start; background: ${THEME.surfaceHi}; color: ${THEME.grayLight}; border-bottom-left-radius: 5px; }
      .confirm { position: absolute; inset: 0; background: rgba(12,21,26,0.88); border-radius: 22px 22px 0 0; display: flex; flex-direction: column; justify-content: center; padding: 24px; }
      .toast { position: absolute; left: 16px; right: 16px; bottom: 92px; z-index: 40; display: flex; align-items: center; gap: 8px; border-radius: 12px; padding: 11px 14px; color: ${THEME.grayLight}; font-size: 13px; font-weight: 600; box-shadow: 0 10px 26px rgba(0,0,0,0.45); animation: toastIn 0.2s ease; }
      .level-up-banner { position: absolute; left: 16px; right: 16px; top: 60px; z-index: 60; display: flex; align-items: center; gap: 12px; background: ${THEME.slateDeep}; border: 1px solid ${THEME.mintLight}; border-radius: 16px; padding: 12px 14px; box-shadow: 0 14px 34px rgba(0,0,0,0.5); animation: levelUpIn 0.4s cubic-bezier(0.23, 1, 0.320, 1); cursor: pointer; }
      @keyframes levelUpIn { 0% { transform: translateY(-16px) scale(0.94); opacity: 0; } 60% { transform: translateY(2px) scale(1.02); opacity: 1; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
      @media (prefers-reduced-motion: reduce) { .level-up-banner { animation: none; } }
      .sheet-backdrop { position: absolute; inset: 0; background: rgba(12,21,26,0.55); display: flex; align-items: flex-end; z-index: 20; }
      .sheet { width: 100%; max-height: 88%; background: ${THEME.surface}; border-radius: 22px 22px 0 0; border-top: 1px solid ${THEME.hairline}; display: flex; flex-direction: column; animation: slideUp 0.22s ease; position: relative; }
      .sheet-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px 10px; }
      .sheet-body { padding: 6px 18px 16px; overflow-y: auto; }
      .sheet-foot { padding: 10px 18px 20px; }
      @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      @keyframes toastIn { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      @media (prefers-reduced-motion: reduce) { .sheet, .toast { animation: none; } }
    `}</style>
  );
}

export default GlobalStyles;
