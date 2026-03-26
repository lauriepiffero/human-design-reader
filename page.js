"use client";

import { useState, useCallback, useEffect } from "react";

const THEME = {
  bg: "#080c18",
  cardBg: "#0f1528",
  cardBorder: "#1a2040",
  accent: "#c4a35a",
  accentLight: "#e8d5a3",
  accentDim: "rgba(196,163,90,0.12)",
  text: "#d4cfc5",
  textMuted: "#7a7670",
  textDark: "#4a4640",
  error: "#d4564a",
};

const TYPES = ["Generator", "Manifesting Generator", "Projector", "Manifestor", "Reflector"];
const AUTHORITIES = [
  "Émotionnelle (Plexus Solaire)",
  "Sacrale",
  "Splénique (Rate)",
  "Ego / Cœur manifesté",
  "Ego / Cœur projeté",
  "Self / G projeté",
  "Mentale / Environnementale",
  "Lunaire (Reflector)",
];
const PROFILES = ["1/3", "1/4", "2/4", "2/5", "3/5", "3/6", "4/6", "4/1", "5/1", "5/2", "6/2", "6/3"];
const DEFINITIONS = [
  "Définition simple",
  "Définition double (Split)",
  "Définition triple (Triple Split)",
  "Définition quadruple (Quadruple Split)",
  "Aucune définition (Reflector)",
];
const STRATEGIES = {
  "Generator": "Répondre",
  "Manifesting Generator": "Répondre puis informer",
  "Projector": "Attendre l'invitation",
  "Manifestor": "Informer",
  "Reflector": "Attendre un cycle lunaire (28 jours)",
};
const CENTERS = [
  "Tête",
  "Ajna",
  "Gorge",
  "Centre G (Identité / Soi)",
  "Cœur (Ego / Volonté)",
  "Plexus Solaire (Émotionnel)",
  "Sacral",
  "Rate (Splénique)",
  "Racine",
];

function buildAnalysisPrompt(data) {
  let dataText = `TYPE : ${data.type}
STRATÉGIE : ${STRATEGIES[data.type] || "non renseignée"}
AUTORITÉ : ${data.authority}
PROFIL : ${data.profile}
DÉFINITION : ${data.definition}
CROIX D'INCARNATION : ${data.cross || "non renseignée"}
CENTRES DÉFINIS : ${data.definedCenters.length > 0 ? data.definedCenters.join(", ") : "aucun"}
CENTRES NON DÉFINIS : ${CENTERS.filter((c) => !data.definedCenters.includes(c)).join(", ")}`;

  if (data.channels && data.channels.trim()) {
    dataText += `\nCANAUX ACTIVÉS : ${data.channels}`;
  }
  if (data.gates && data.gates.trim()) {
    dataText += `\nPORTES ACTIVÉES : ${data.gates}`;
  }
  if (data.digestion && data.digestion.trim()) {
    dataText += `\nDIGESTION (PHS) : ${data.digestion}`;
  }
  if (data.environment && data.environment.trim()) {
    dataText += `\nENVIRONNEMENT : ${data.environment}`;
  }
  if (data.perspective && data.perspective.trim()) {
    dataText += `\nPERSPECTIVE : ${data.perspective}`;
  }
  if (data.motivation && data.motivation.trim()) {
    dataText += `\nMOTIVATION : ${data.motivation}`;
  }

  return `Tu es un coach d'élite en Human Design. Tu donnes des lectures d'une profondeur et d'une justesse que la personne n'a probablement jamais reçues, même après des années d'introspection. Tu lis entre les lignes sans jamais interpréter à la place du client ni faire d'injonction.

Voici les données du Design de la personne :

${dataText}

Fais une lecture complète et profonde. Structure ta réponse ainsi :

VUE D'ENSEMBLE
Son Type, sa Stratégie et son Autorité — ce que ça signifie concrètement dans sa vie quotidienne, pas juste la définition théorique. Comment ça se vit vraiment.

PROFIL ${data.profile}
Les deux lignes en détail, leur interaction, comment ça se manifeste dans la façon dont cette personne apprend, interagit, évolue et traverse la vie.

CENTRES DÉFINIS ET NON DÉFINIS
Pour chaque centre pertinent : ce que ça implique au quotidien, les conditionnements possibles, les pièges, les forces. Concentre-toi sur les insights les plus puissants plutôt que de lister mécaniquement chaque centre.

CANAUX ET PORTES
Si des canaux ou portes ont été fournis, fais une lecture fine de la combinaison unique de cette personne. Pas une liste — une interprétation de ce que ces activations créent ensemble, les thèmes qui émergent, les talents profonds. Si les données ne sont pas disponibles, passe cette section.

CROIX D'INCARNATION
Si la croix a été fournie : le thème de vie profond, la direction existentielle, le rôle que cette personne est ici pour jouer. Si non fournie, passe cette section.

VARIABLES
Si les données de digestion, environnement, perspective ou motivation ont été fournies :
- Digestion / alimentation : recommandations concrètes liées au type de digestion (PHS)
- Environnement : le type d'environnement dans lequel cette personne s'épanouit
- Perspective et Motivation : comment cette personne perçoit le monde et ce qui la met en mouvement
Si non fournies, passe cette section.

✨ LA RECETTE DU SUCCÈS
Une synthèse personnalisée et actionnable de ce qui fait que cette personne spécifique est alignée et dans sa puissance. Pas de généralités. Des pistes concrètes et spécifiques à ce Design.

🔮 QUESTIONS DE RÉALIGNEMENT
Des questions puissantes, singulières et dérangeantes (au bon sens du terme) pour :
- Identifier un désalignement potentiel (cette personne vit-elle selon son design ou contre ?)
- Permettre le réalignement à sa véritable nature si nécessaire
Ces questions doivent être précises et adaptées à CE design spécifique, pas des questions génériques.

Règles impératives :
- Parle de façon humaine, simple, claire. Pas de ton copywriter, pas de phrases empilées façon IA.
- Ne cite jamais tes sources.
- Utilise "tu" pour t'adresser à la personne.
- Pas de gras, pas d'astérisques, pas de mise en forme markdown.
- Aère le texte naturellement avec des sauts de ligne.
- Émojis autorisés avec parcimonie, uniquement : ✨🔮🧬👌🏼🟡
- Relie CHAQUE information à la vie concrète. Zéro théorie flottante.
- Ne fais jamais d'injonction ("tu dois", "il faut"). Éclaire, questionne, révèle.
- Écris comme un humain qui parle simplement, avec des phrases construites et un rythme naturel.`;
}

async function callClaude(messages, maxTokens = 4096) {
  const response = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, max_tokens: maxTokens }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Erreur ${response.status}`);
  }
  return response.json();
}

const LOADING_MESSAGES = [
  "Analyse de ton Design en profondeur…",
  "Exploration de tes centres et canaux…",
  "Connexion des éléments entre eux…",
  "Formulation de ta recette du succès…",
  "Préparation des questions de réalignement…",
];

function LoadingIndicator() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <div
        style={{
          width: 48,
          height: 48,
          margin: "0 auto 32px",
          border: `2px solid ${THEME.cardBorder}`,
          borderTop: `2px solid ${THEME.accent}`,
          borderRadius: "50%",
          animation: "hdSpin 1s linear infinite",
        }}
      />
      <p
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 20,
          color: THEME.accentLight,
        }}
      >
        {LOADING_MESSAGES[idx]}
      </p>
      <style>{`@keyframes hdSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Select({ label, value, onChange, options, placeholder }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", color: THEME.textMuted, fontSize: 13, marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "12px 16px",
          background: THEME.bg,
          border: `1px solid ${THEME.cardBorder}`,
          borderRadius: 10,
          color: value ? THEME.text : THEME.textDark,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          outline: "none",
          cursor: "pointer",
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%237a7670' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 16px center",
        }}
      >
        <option value="" style={{ color: THEME.textDark }}>{placeholder || "Sélectionne..."}</option>
        {options.map((opt) => (
          <option key={opt} value={opt} style={{ color: THEME.text, background: THEME.bg }}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder, multiline }) {
  const shared = {
    width: "100%",
    padding: "12px 16px",
    background: THEME.bg,
    border: `1px solid ${THEME.cardBorder}`,
    borderRadius: 10,
    color: THEME.text,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    lineHeight: 1.5,
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", color: THEME.textMuted, fontSize: 13, marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
        {label}
      </label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ ...shared, resize: "vertical" }} />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={shared} />
      )}
    </div>
  );
}

function CenterPicker({ selected, onChange }) {
  const toggle = (center) => {
    if (selected.includes(center)) {
      onChange(selected.filter((c) => c !== center));
    } else {
      onChange([...selected, center]);
    }
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", color: THEME.textMuted, fontSize: 13, marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>
        Centres définis (colorés sur ta charte) — clique pour sélectionner
      </label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {CENTERS.map((center) => {
          const active = selected.includes(center);
          return (
            <button
              key={center}
              onClick={() => toggle(center)}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: `1px solid ${active ? THEME.accent : THEME.cardBorder}`,
                background: active ? THEME.accentDim : "transparent",
                color: active ? THEME.accentLight : THEME.textMuted,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {center}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatAnalysis(text) {
  const sections = text.split(/\n(?=VUE D'ENSEMBLE|PROFIL |CENTRES |CANAUX |CROIX |VARIABLES|✨|🔮)/);
  return sections.map((section, i) => {
    const lines = section.trim().split("\n");
    const firstLine = lines[0];
    const isTitle = /^(VUE D'ENSEMBLE|PROFIL |CENTRES |CANAUX |CROIX |VARIABLES|✨|🔮)/.test(firstLine);

    if (isTitle) {
      return (
        <div key={i} style={{ marginBottom: 32 }}>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: THEME.accentLight, marginBottom: 16, fontWeight: 500, letterSpacing: "0.02em" }}>
            {firstLine}
          </h3>
          {lines.slice(1).map((line, j) =>
            line.trim() ? (
              <p key={j} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: THEME.text, lineHeight: 1.75, marginBottom: 12 }}>{line}</p>
            ) : (
              <div key={j} style={{ height: 8 }} />
            )
          )}
        </div>
      );
    }

    return (
      <div key={i} style={{ marginBottom: 16 }}>
        {lines.map((line, j) =>
          line.trim() ? (
            <p key={j} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: THEME.text, lineHeight: 1.75, marginBottom: 12 }}>{line}</p>
          ) : (
            <div key={j} style={{ height: 8 }} />
          )
        )}
      </div>
    );
  });
}

export default function HumanDesignReader() {
  const [step, setStep] = useState("form");
  const [formData, setFormData] = useState({
    type: "", authority: "", profile: "", definition: "", cross: "",
    definedCenters: [], channels: "", gates: "",
    digestion: "", environment: "", perspective: "", motivation: "",
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [error, setError] = useState(null);

  const updateField = (field) => (value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = formData.type && formData.authority && formData.profile && formData.definition;

  const handleAnalyze = useCallback(async () => {
    if (!isFormValid) return;
    setStep("analyzing");
    setError(null);
    try {
      const prompt = buildAnalysisPrompt(formData);
      const result = await callClaude([{ role: "user", content: prompt }], 4096);
      const text = result.content.map((c) => c.text || "").join("");
      setAnalysis(text);
      setStep("result");

      if (result.stop_reason === "max_tokens") {
        try {
          const cont = await callClaude(
            [
              { role: "user", content: prompt },
              { role: "assistant", content: text },
              { role: "user", content: "Continue ta lecture exactement là où tu t'es arrêté." },
            ],
            4096
          );
          const contText = cont.content.map((c) => c.text || "").join("");
          setAnalysis((prev) => prev + "\n" + contText);
        } catch {}
      }
    } catch (e) {
      setError(`Erreur lors de l'analyse : ${e.message}`);
      setStep("form");
    }
  }, [formData, isFormValid]);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8">
      <title>Lecture Human Design</title>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'DM Sans', sans-serif; color: #1a1a1a; max-width: 700px; margin: 40px auto; padding: 0 24px; line-height: 1.75; font-size: 14px; }
        h1 { font-family: 'Cormorant Garamond', serif; font-size: 28px; margin-bottom: 8px; font-weight: 500; }
        h3 { font-family: 'Cormorant Garamond', serif; font-size: 20px; margin-top: 32px; margin-bottom: 12px; font-weight: 500; color: #8a7340; }
        .subtitle { color: #888; font-size: 13px; margin-bottom: 32px; }
        .data-section { background: #f8f6f1; padding: 20px 24px; border-radius: 8px; margin-bottom: 32px; }
        .data-row { display: flex; gap: 12px; padding: 4px 0; font-size: 13px; }
        .data-label { color: #888; min-width: 140px; }
        p { margin-bottom: 10px; }
        @media print { body { margin: 20px; } }
      </style>
    </head><body>
      <h1>Ta Lecture Human Design</h1>
      <p class="subtitle">Type ${formData.type} — Profil ${formData.profile}</p>
      <div class="data-section">
        <div class="data-row"><span class="data-label">Type</span><span>${formData.type}</span></div>
        <div class="data-row"><span class="data-label">Stratégie</span><span>${STRATEGIES[formData.type] || ""}</span></div>
        <div class="data-row"><span class="data-label">Autorité</span><span>${formData.authority}</span></div>
        <div class="data-row"><span class="data-label">Profil</span><span>${formData.profile}</span></div>
        <div class="data-row"><span class="data-label">Définition</span><span>${formData.definition}</span></div>
        ${formData.cross ? `<div class="data-row"><span class="data-label">Croix</span><span>${formData.cross}</span></div>` : ""}
      </div>
      ${analysis
        .split(/\n(?=VUE D'ENSEMBLE|PROFIL |CENTRES |CANAUX |CROIX |VARIABLES|✨|🔮)/)
        .map((s) => {
          const lines = s.trim().split("\n");
          const first = lines[0];
          const isT = /^(VUE D'ENSEMBLE|PROFIL |CENTRES |CANAUX |CROIX |VARIABLES|✨|🔮)/.test(first);
          if (isT) {
            return `<h3>${first}</h3>${lines.slice(1).map((l) => (l.trim() ? `<p>${l}</p>` : "")).join("")}`;
          }
          return lines.map((l) => (l.trim() ? `<p>${l}</p>` : "")).join("");
        })
        .join("")}
    </body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 600);
  };

  const handleReset = () => {
    setStep("form");
    setFormData({ type: "", authority: "", profile: "", definition: "", cross: "", definedCenters: [], channels: "", gates: "", digestion: "", environment: "", perspective: "", motivation: "" });
    setShowAdvanced(false);
    setAnalysis("");
    setError(null);
  };

  const cardStyle = {
    background: THEME.cardBg,
    border: `1px solid ${THEME.cardBorder}`,
    borderRadius: 16,
    padding: "32px 28px",
    maxWidth: 680,
    margin: "0 auto",
  };

  const btnPrimary = {
    background: THEME.accent, color: "#0a0e18", border: "none", borderRadius: 10,
    padding: "14px 32px", fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500, cursor: "pointer",
  };
  const btnDisabled = { ...btnPrimary, opacity: 0.4, cursor: "not-allowed" };
  const btnSecondary = {
    background: "transparent", color: THEME.textMuted, border: `1px solid ${THEME.cardBorder}`,
    borderRadius: 10, padding: "12px 24px", fontFamily: "'DM Sans', sans-serif", fontSize: 14, cursor: "pointer",
  };

  return (
    <div style={{ minHeight: "100vh", background: THEME.bg, color: THEME.text, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 740, margin: "0 auto", padding: "40px 20px" }}>

        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p style={{ fontSize: 14, color: THEME.accent, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>✨ Human Design</p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 500, color: THEME.accentLight, margin: "0 0 8px", letterSpacing: "0.02em" }}>
            Ta Lecture Personnalisée
          </h1>
          <p style={{ color: THEME.textMuted, fontSize: 14, lineHeight: 1.6 }}>
            Renseigne les informations de ta charte et reçois une analyse profonde de ton Design
          </p>
        </div>

        {error && (
          <div style={{ background: "rgba(212,86,74,0.1)", border: "1px solid rgba(212,86,74,0.25)", borderRadius: 10, padding: "14px 20px", marginBottom: 24, color: THEME.error, fontSize: 14, lineHeight: 1.5 }}>
            {error}
          </div>
        )}

        {step === "form" && (
          <div style={cardStyle}>
            <div style={{ padding: "16px 20px", background: THEME.accentDim, borderRadius: 10, borderLeft: `3px solid ${THEME.accent}`, marginBottom: 28 }}>
              <p style={{ color: THEME.text, fontSize: 14, lineHeight: 1.6, margin: "0 0 8px" }}>
                Tu ne connais pas encore ton Design ? Génère ta charte gratuitement sur l'un de ces sites, puis reporte les infos ci-dessous :
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a href="https://www.mybodygraph.com/" target="_blank" rel="noopener noreferrer" style={{ color: THEME.accent, fontSize: 13, textDecoration: "underline" }}>myBodyGraph.com</a>
                <a href="https://www.geneticmatrix.com/" target="_blank" rel="noopener noreferrer" style={{ color: THEME.accent, fontSize: 13, textDecoration: "underline" }}>GeneticMatrix.com</a>
              </div>
            </div>

            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: THEME.accentLight, marginBottom: 20, fontWeight: 500 }}>Les essentiels</p>

            <Select label="Type" value={formData.type} onChange={updateField("type")} options={TYPES} placeholder="Sélectionne ton type..." />
            <Select label="Autorité" value={formData.authority} onChange={updateField("authority")} options={AUTHORITIES} placeholder="Sélectionne ton autorité..." />
            <Select label="Profil" value={formData.profile} onChange={updateField("profile")} options={PROFILES} placeholder="Sélectionne ton profil..." />
            <Select label="Définition" value={formData.definition} onChange={updateField("definition")} options={DEFINITIONS} placeholder="Sélectionne ta définition..." />

            <TextInput label="Croix d'Incarnation (optionnel)" value={formData.cross} onChange={updateField("cross")} placeholder="Ex: Croix du Sphinx de l'Angle Droit (1/2 | 7/13)" />

            <CenterPicker selected={formData.definedCenters} onChange={updateField("definedCenters")} />

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                background: "transparent", border: "none", color: THEME.accent,
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, cursor: "pointer",
                padding: "8px 0", marginBottom: 8, display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <span style={{ transform: showAdvanced ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s", display: "inline-block" }}>▸</span>
              Pour une lecture encore plus profonde (canaux, portes, variables)
            </button>

            {showAdvanced && (
              <div style={{ padding: "20px 0 0", borderTop: `1px solid ${THEME.cardBorder}`, marginTop: 12 }}>
                <TextInput label="Canaux activés" value={formData.channels} onChange={updateField("channels")} placeholder="Ex: 20-34 (Canal du Charisme), 57-10..." multiline />
                <TextInput label="Portes activées" value={formData.gates} onChange={updateField("gates")} placeholder="Ex: 1, 7, 10, 13, 25, 34, 46, 51..." multiline />

                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: THEME.accentLight, margin: "24px 0 16px", fontWeight: 500 }}>Variables (flèches)</p>
                <TextInput label="Digestion (PHS)" value={formData.digestion} onChange={updateField("digestion")} placeholder="Ex: Alternating (chaud), Consecutive, Direct Light..." />
                <TextInput label="Environnement" value={formData.environment} onChange={updateField("environment")} placeholder="Ex: Markets (externe), Caves, Kitchens, Mountains..." />
                <TextInput label="Perspective (Vision)" value={formData.perspective} onChange={updateField("perspective")} placeholder="Ex: Survival, Possibility, Power, Wanting..." />
                <TextInput label="Motivation" value={formData.motivation} onChange={updateField("motivation")} placeholder="Ex: Fear, Hope, Desire, Need, Guilt, Innocence..." />
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "center", marginTop: 28 }}>
              <button onClick={handleAnalyze} disabled={!isFormValid} style={isFormValid ? btnPrimary : btnDisabled}>
                Lancer l'analyse en profondeur →
              </button>
            </div>
          </div>
        )}

        {step === "analyzing" && (
          <div style={cardStyle}><LoadingIndicator /></div>
        )}

        {step === "result" && (
          <div>
            <div style={{ ...cardStyle, marginBottom: 20 }}>
              <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: `1px solid ${THEME.cardBorder}` }}>
                <p style={{ color: THEME.accent, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Lecture complète</p>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: THEME.accentLight, fontWeight: 500, margin: "0 0 8px" }}>
                  {formData.type} — Profil {formData.profile}
                </h2>
                {formData.cross && <p style={{ color: THEME.textMuted, fontSize: 14 }}>{formData.cross}</p>}
              </div>
              {formatAnalysis(analysis)}
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
              <button onClick={handleReset} style={btnSecondary}>← Nouvelle lecture</button>
              <button onClick={handlePrint} style={btnPrimary}>Sauvegarder en PDF</button>
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 60, paddingBottom: 20 }}>
          <p style={{ color: THEME.textDark, fontSize: 12 }}>Propulsé par Claude · Lecture à titre indicatif</p>
        </div>
      </div>
    </div>
  );
}
