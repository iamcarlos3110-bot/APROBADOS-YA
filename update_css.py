with open('style_v2.css', 'a', encoding='utf-8') as f:
    f.write('''
/* ── Tarjetas de Inicio Fase 1 ── */
.home-top-cards {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 16px;
  margin-bottom: 30px;
}
@media (max-width: 900px) {
  .home-top-cards { grid-template-columns: 1fr; }
}
.home-card-btn {
  background: var(--bg-card); border-radius: 16px; padding: 20px;
  box-shadow: var(--shadow); border: 1px solid var(--border);
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  cursor: pointer; transition: all var(--t); text-align: center;
}
.home-card-btn:hover {
  transform: translateY(-3px); box-shadow: var(--shadow-glow); border-color: var(--olive);
}
.home-card-btn h3 { font-size: 16px; margin-top: 8px; color: var(--text); }
.home-card-btn .icon { font-size: 32px; }

/* ── Progreso Avanzado ── */
.progress-list { margin-top: 24px; display: flex; flex-direction: column; gap: 12px; }
.progress-item {
  display: flex; justify-content: space-between; align-items: center;
  background: var(--bg-card); padding: 16px; border-radius: 12px;
  border: 1px solid var(--border);
}
.progress-item-name { font-weight: 600; color: var(--text); }
.progress-item-score { font-weight: 800; }
.score-red { color: #E74C3C; }
.score-orange { color: #E67E22; }
.score-green { color: #2ECC71; }
.daily-goal-bar-wrap { width: 100%; height: 12px; background: var(--bg-muted); border-radius: 6px; margin: 16px 0; overflow: hidden; }
.daily-goal-bar { height: 100%; background: var(--olive); border-radius: 6px; transition: width var(--t); }

/* ── Memorizar y Favoritos (Interactivos) ── */
.memo-card {
  background: var(--bg-card); border-radius: 16px; padding: 24px;
  box-shadow: var(--shadow); border: 1px solid var(--border);
  margin-bottom: 20px; position: relative;
}
.memo-q { font-size: 18px; font-weight: 700; margin-bottom: 20px; color: var(--text); padding-right: 40px; }
.memo-fav-btn {
  position: absolute; top: 20px; right: 20px; font-size: 24px;
  background: none; border: none; cursor: pointer; color: var(--text3);
  transition: all var(--t);
}
.memo-fav-btn.active { color: #F1C40F; }
.memo-opt-btn {
  display: block; width: 100%; text-align: left; padding: 14px 20px;
  margin-bottom: 8px; background: var(--bg); border: 1px solid var(--border);
  border-radius: 12px; font-size: 16px; color: var(--text2); cursor: pointer;
  transition: all var(--t);
}
.memo-opt-btn:hover { background: var(--bg-muted); }
.memo-opt-btn.correct { background: #D5F5E3; border-color: #2ECC71; color: #1E8449; font-weight: 600; }
.memo-opt-btn.wrong { background: #FADBD8; border-color: #E74C3C; color: #922B21; text-decoration: line-through; }
.memo-feedback { margin-top: 16px; padding: 16px; border-radius: 12px; font-weight: 500; display: none; }
.memo-feedback.show { display: block; }
.memo-feedback.success { background: #E9F7EF; color: #1E8449; }
.memo-feedback.error { background: #FDEDEC; color: #922B21; }
.memo-actions { display: flex; justify-content: space-between; margin-top: 24px; gap: 12px; }
.memo-badge {
  display: inline-block; padding: 4px 8px; border-radius: 6px;
  background: var(--olive-pale); color: var(--olive); font-size: 12px; font-weight: 700;
  margin-bottom: 12px;
}
''')
