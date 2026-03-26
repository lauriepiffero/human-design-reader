"use client";

import { useState, useRef, useCallback, useEffect } from "react";

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
  success: "#5ab88a",
};

function resizeImage(file, maxDim = 1600) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width <= maxDim && height <= maxDim) {
          resolve(e.target.result.split(",")[1]);
          return;
        }
        const canvas = document.createElement("canvas");
        if (width > height) {
          height = (height / width) * maxDim;
          width = maxDim;
        } else {
          width = (width / height) * maxDim;
          height = maxDim;
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85).split(",")[1]);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

const EXTRACTION_PROMPT = `Tu es un expert en Human Design. Analyse cette image de charte Human Design (bodygraph).

MÉTHODE OBLIGATOIRE — suis ces étapes dans l'ordre :

ÉTAPE 1 — CHERCHE LES DONNÉES TEXTUELLES D'ABORD
La plupart des chartes affichent le Type, la Stratégie, l'Autorité, le Profil, la Définition et la Croix d'Incarnation en TEXTE à côté ou en dessous du bodygraph. Lis ces textes en priorité. C'est la source la plus fiable.

ÉTAPE 2 — IDENTIFIE LES CENTRES
Regarde les 9 formes géométriques du bodygraph. Un centre DÉFINI est coloré (rouge, marron, jaune, vert, or, orange...). Un centre NON DÉFINI est blanc, gris très clair ou transparent.
Les 9 centres de haut en bas :
- Tête (triangle en haut, pointe vers le haut)
- Ajna (triangle sous la tête, pointe vers le bas)
- Gorge (carré)
- Centre G / Soi (losange au centre)
- Cœur / Ego / Volonté (petit triangle à droite)
- Plexus Solaire / Émotionnel (triangle en bas à droite)
- Sacral (carré en bas au centre)
- Rate / Splénique (triangle en bas à gauche)
- Racine (carré tout en bas)

ÉTAPE 3 — VÉRIFIE LE TYPE PAR COHÉRENCE
Si tu as lu le Type en texte (étape 1), vérifie qu'il est cohérent avec les centres définis :
- Reflector = ZÉRO centre défini (tous blancs). Si tu vois un seul centre coloré, ce n'est PAS un Reflector.
- Generator = Sacral défini (coloré), sans connexion moteur-Gorge directe
- Manifesting Generator = Sacral défini (coloré) + canal moteur connecté à la Gorge
- Projector = Sacral NON défini (blanc) + au moins un autre centre défini
- Manifestor = Sacral NON défini (blanc) + Gorge connectée à un centre moteur

Si le texte dit une chose et les centres en disent une autre, signale l'incohérence dans "notes" et fie-toi AUX CENTRES pour déterminer le type.

ÉTAPE 4 — EXTRAIS LE RESTE
- Canaux : les lignes colorées reliant deux centres (un canal = deux portes connectées)
- Portes : les petits numéros sur les lignes. Noir/couleur de la personnalité = conscientes. Rouge = inconscientes.
- Variables/flèches : les 4 flèches en haut et en bas du bodygraph (parfois absentes)

Réponds UNIQUEMENT en JSON valide. Pas de markdown, pas de backticks, pas de texte avant ou après le JSON.

{
  "type_lu_en_texte": "le type tel qu'écrit sur la charte, ou 'non visible' si pas affiché",
  "type": "le type final après vérification de cohérence avec les centres",
  "strategy": "...",
  "authority": "...",
  "profile": "...",
  "definition": "...",
  "incarnation_cross": "...",
  "defined_centers": ["liste des centres colorés"],
  "undefined_centers": ["liste des centres blancs/ouverts"],
  "channels": ["numéro-numéro"],
  "gates_conscious": ["numéro"],
  "gates_unconscious": ["numéro"],
  "variables": {
    "digestion": "...",
    "environment": "...",
    "perspective": "...",
    "motivation": "..."
  },
  "readable": true,
  "notes": "toute incohérence ou difficulté de lecture"
}

Si les variables/flèches ne sont pas visibles, mets "non visible".
Si l'image n'est PAS une charte HD : {"readable": false, "notes": "Cette image ne semble pas être une charte Human Design."}
Si certaines données sont illisibles, indique "non lisible" et explique dans "notes".`;

function buildAnalysisPrompt(data, corrections) {
  let dataText = `TYPE : ${data.type}
STRATÉGIE : ${data.strategy}
AUTORITÉ : ${data.authority}
PROFIL : ${data.profile}
DÉFINITION : ${data.definition}
CROIX D'INCARNATION : ${data.incarnation_cross}
CENTRES DÉFINIS : ${(data.defined_centers || []).join(", ")}
CENTRES NON DÉFINIS : ${(data.undefined_centers || []).join(", ")}
CANAUX : ${(data.channels || []).join(", ")}
PORTES CONSCIENTES : ${(data.gates_conscious || []).join(", ")}
PORTES INCONSCIENTES : ${(data.gates_unconscious || []).join(", ")}`;

  if (data.variables) {
    dataText += `\nDIGESTION : ${data.variables.digestion}
ENVIRONNEMENT : ${data.variables.environment}
PERSPECTIVE : ${data.variables.perspective}
MOTIVATION : ${data.variables.motivation}`;
  }

  if (corrections && corrections.trim()) {
    dataText += `\n\nCORRECTIONS DE L'UTILISATEUR : ${corrections}`;
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
Lecture fine de la combinaison unique de cette personne. Pas une liste — une interprétation de ce que ces activations créent ensemble, les thèmes qui émergent, les talents profonds.

CROIX D'INCARNATION
Le thème de vie profond, la direction existentielle, le rôle que cette personne est ici pour jouer.

VARIABLES
Si les données sont disponibles :
- Digestion / alimentation : recommandations concrètes liées au type de digestion (PHS)
- Environnement : le type d'environnement dans lequel cette personne s'épanouit
- Perspective et Motivation : comment cette personne perçoit le monde et ce qui la met en mouvement

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

const LOADING_MESSAGES_EXTRACT = [
  "Lecture de ta charte en cours…",
  "Identification des centres et canaux…",
  "Extraction des portes et variables…",
  "Vérification des données…",
];

const LOADING_MESSAGES_ANALYSIS = [
  "Analyse de ton Design en profondeur…",
  "Exploration de tes canaux et portes…",
  "Connexion des éléments entre eux…",
  "Formulation de ta recette du succès…",
  "Préparation des questions de réalignement…",
];

function LoadingIndicator({ messages }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setIdx((i) => (i + 1) % messages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [messages.length]);

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
          transition: "opacity 0.3s",
        }}
      >
        {messages[idx]}
      </p>
      <style>{`@keyframes hdSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function FieldRow({ label, value }) {
  if (!value || value === "non lisible" || value === "non visible") {
    return (
      <div style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: `1px solid ${THEME.cardBorder}` }}>
        <span style={{ color: THEME.textMuted, minWidth: 160, fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>{label}</span>
        <span style={{ color: THEME.textDark, fontStyle: "italic", fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>non disponible</span>
      </div>
    );
  }
  const displayValue = Array.isArray(value) ? value.join(", ") : value;
  return (
    <div style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: `1px solid ${THEME.cardBorder}` }}>
      <span style={{ color: THEME.textMuted, minWidth: 160, flexShrink: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>{label}</span>
      <span style={{ color: THEME.text, fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.5 }}>{displayValue}</span>
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
          <h3
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 22,
              color: THEME.accentLight,
              marginBottom: 16,
              fontWeight: 500,
              letterSpacing: "0.02em",
            }}
          >
            {firstLine}
          </h3>
          {lines.slice(1).map((line, j) =>
            line.trim() ? (
              <p
                key={j}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 15,
                  color: THEME.text,
                  lineHeight: 1.75,
                  marginBottom: 12,
                }}
              >
                {line}
              </p>
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
            <p
              key={j}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                color: THEME.text,
                lineHeight: 1.75,
                marginBottom: 12,
              }}
            >
              {line}
            </p>
          ) : (
            <div key={j} style={{ height: 8 }} />
          )
        )}
      </div>
    );
  });
}

export default function HumanDesignReader() {
  const [step, setStep] = useState("upload");
  const [imageBase64, setImageBase64] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [corrections, setCorrections] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("Envoie une image de ta charte Human Design (PNG, JPG, WEBP).");
      return;
    }
    setError(null);
    setImagePreview(URL.createObjectURL(file));
    try {
      const base64 = await resizeImage(file);
      setImageBase64(base64);
    } catch (e) {
      setError("Impossible de lire cette image. Essaie avec un autre format.");
    }
  }, []);

  const handleExtract = useCallback(async () => {
    if (!imageBase64) return;
    setStep("extracting");
    setError(null);
    try {
      const result = await callClaude(
        [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: "image/jpeg", data: imageBase64 },
              },
              { type: "text", text: EXTRACTION_PROMPT },
            ],
          },
        ],
        2000
      );

      const text = result.content.map((c) => c.text || "").join("");
      const clean = text.replace(/```json|```/g, "").trim();
      let parsed;
      try {
        parsed = JSON.parse(clean);
      } catch {
        const jsonMatch = clean.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Réponse inattendue");
        }
      }

      if (parsed.readable === false) {
        setError(parsed.notes || "Cette image ne semble pas être une charte Human Design.");
        setStep("upload");
        return;
      }
      setChartData(parsed);
      setStep("confirm");
    } catch (e) {
      setError(`Erreur lors de la lecture : ${e.message}. Réessaie ou utilise une image plus nette.`);
      setStep("upload");
    }
  }, [imageBase64]);

  const handleAnalyze = useCallback(async () => {
    if (!chartData) return;
    setStep("analyzing");
    setError(null);
    try {
      const prompt = buildAnalysisPrompt(chartData, corrections);
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
      setStep("confirm");
    }
  }, [chartData, corrections]);

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
      <p class="subtitle">Type ${chartData?.type || ""} — Profil ${chartData?.profile || ""}</p>
      <div class="data-section">
        <div class="data-row"><span class="data-label">Type</span><span>${chartData?.type || ""}</span></div>
        <div class="data-row"><span class="data-label">Stratégie</span><span>${chartData?.strategy || ""}</span></div>
        <div class="data-row"><span class="data-label">Autorité</span><span>${chartData?.authority || ""}</span></div>
        <div class="data-row"><span class="data-label">Profil</span><span>${chartData?.profile || ""}</span></div>
        <div class="data-row"><span class="data-label">Définition</span><span>${chartData?.definition || ""}</span></div>
        <div class="data-row"><span class="data-label">Croix</span><span>${chartData?.incarnation_cross || ""}</span></div>
      </div>
      ${analysis
        .split(/\n(?=VUE D'ENSEMBLE|PROFIL |CENTRES |CANAUX |CROIX |VARIABLES|✨|🔮)/)
        .map((s) => {
          const lines = s.trim().split("\n");
          const first = lines[0];
          const isT = /^(VUE D'ENSEMBLE|PROFIL |CENTRES |CANAUX |CROIX |VARIABLES|✨|🔮)/.test(first);
          if (isT) {
            return `<h3>${first}</h3>${lines
              .slice(1)
              .map((l) => (l.trim() ? `<p>${l}</p>` : ""))
              .join("")}`;
          }
          return lines.map((l) => (l.trim() ? `<p>${l}</p>` : "")).join("");
        })
        .join("")}
    </body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 600);
  };

  const handleReset = () => {
    setStep("upload");
    setImageBase64(null);
    setImagePreview(null);
    setChartData(null);
    setCorrections("");
    setAnalysis("");
    setError(null);
  };

  const containerStyle = {
    minHeight: "100vh",
    background: THEME.bg,
    color: THEME.text,
    fontFamily: "'DM Sans', sans-serif",
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
    background: THEME.accent,
    color: "#0a0e18",
    border: "none",
    borderRadius: 10,
    padding: "14px 32px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
  };

  const btnSecondary = {
    background: "transparent",
    color: THEME.textMuted,
    border: `1px solid ${THEME.cardBorder}`,
    borderRadius: 10,
    padding: "12px 24px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    cursor: "pointer",
    transition: "all 0.2s",
  };

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: 740, margin: "0 auto", padding: "40px 20px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p style={{ fontSize: 14, color: THEME.accent, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
            ✨ Human Design
          </p>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 36,
              fontWeight: 500,
              color: THEME.accentLight,
              margin: "0 0 8px",
              letterSpacing: "0.02em",
            }}
          >
            Ta Lecture Personnalisée
          </h1>
          <p style={{ color: THEME.textMuted, fontSize: 14, lineHeight: 1.6 }}>
            Uploade ta charte et reçois une analyse profonde de ton Design
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: "rgba(212,86,74,0.1)",
              border: "1px solid rgba(212,86,74,0.25)",
              borderRadius: 10,
              padding: "14px 20px",
              marginBottom: 24,
              color: THEME.error,
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}

        {/* Upload */}
        {step === "upload" && (
          <div style={cardStyle}>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFile(file);
              }}
              style={{
                border: `2px dashed ${dragOver ? THEME.accent : THEME.cardBorder}`,
                borderRadius: 12,
                padding: imagePreview ? "16px" : "60px 20px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.25s",
                background: dragOver ? THEME.accentDim : "transparent",
              }}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Charte HD"
                  style={{ maxWidth: "100%", maxHeight: 400, borderRadius: 8, objectFit: "contain" }}
                />
              ) : (
                <>
                  <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.5 }}>🧬</div>
                  <p style={{ color: THEME.text, fontSize: 15, marginBottom: 6 }}>
                    Glisse ta charte ici ou clique pour choisir un fichier
                  </p>
                  <p style={{ color: THEME.textMuted, fontSize: 13 }}>
                    PNG, JPG ou WEBP — de préférence lisible et en bonne résolution
                  </p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            {imagePreview && (
              <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "center" }}>
                <button
                  onClick={() => { setImagePreview(null); setImageBase64(null); }}
                  style={btnSecondary}
                >
                  Changer d'image
                </button>
                <button onClick={handleExtract} style={btnPrimary}>
                  Analyser ma charte →
                </button>
              </div>
            )}
            <div
              style={{
                marginTop: 28,
                padding: "16px 20px",
                background: THEME.accentDim,
                borderRadius: 10,
                borderLeft: `3px solid ${THEME.accent}`,
              }}
            >
              <p style={{ color: THEME.textMuted, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                Pour une lecture optimale, utilise une charte générée sur myBodyGraph, Genetic Matrix ou Jovian Archive. Plus l'image est lisible, plus l'analyse sera précise.
              </p>
            </div>
          </div>
        )}

        {/* Extracting */}
        {step === "extracting" && (
          <div style={cardStyle}>
            <LoadingIndicator messages={LOADING_MESSAGES_EXTRACT} />
          </div>
        )}

        {/* Confirm */}
        {step === "confirm" && chartData && (
          <div style={cardStyle}>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 24,
                color: THEME.accentLight,
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              Vérifie tes données
            </h2>
            <p style={{ color: THEME.textMuted, fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
              Voici ce que j'ai lu sur ta charte. Vérifie que tout est correct avant de lancer l'analyse en profondeur.
            </p>

            <div style={{ marginBottom: 24 }}>
              <FieldRow label="Type" value={chartData.type} />
              <FieldRow label="Stratégie" value={chartData.strategy} />
              <FieldRow label="Autorité" value={chartData.authority} />
              <FieldRow label="Profil" value={chartData.profile} />
              <FieldRow label="Définition" value={chartData.definition} />
              <FieldRow label="Croix d'Incarnation" value={chartData.incarnation_cross} />
              <FieldRow label="Centres définis" value={chartData.defined_centers} />
              <FieldRow label="Centres non définis" value={chartData.undefined_centers} />
              <FieldRow label="Canaux" value={chartData.channels} />
              <FieldRow label="Portes conscientes" value={chartData.gates_conscious} />
              <FieldRow label="Portes inconscientes" value={chartData.gates_unconscious} />
              {chartData.variables && (
                <>
                  <FieldRow label="Digestion" value={chartData.variables.digestion} />
                  <FieldRow label="Environnement" value={chartData.variables.environment} />
                  <FieldRow label="Perspective" value={chartData.variables.perspective} />
                  <FieldRow label="Motivation" value={chartData.variables.motivation} />
                </>
              )}
            </div>

            {chartData.notes && chartData.notes !== "" && (
              <div
                style={{
                  padding: "12px 16px",
                  background: "rgba(196,163,90,0.08)",
                  borderRadius: 8,
                  marginBottom: 20,
                  fontSize: 13,
                  color: THEME.textMuted,
                  lineHeight: 1.5,
                }}
              >
                Note : {chartData.notes}
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", color: THEME.textMuted, fontSize: 13, marginBottom: 8 }}>
                Quelque chose à corriger ? Indique-le ici :
              </label>
              <textarea
                value={corrections}
                onChange={(e) => setCorrections(e.target.value)}
                placeholder="Ex: Mon type est Projector, pas Generator. Mon profil est 4/6..."
                style={{
                  width: "100%",
                  minHeight: 80,
                  background: THEME.bg,
                  border: `1px solid ${THEME.cardBorder}`,
                  borderRadius: 10,
                  padding: "12px 16px",
                  color: THEME.text,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  resize: "vertical",
                  outline: "none",
                  boxSizing: "border-box",
                  lineHeight: 1.5,
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={handleReset} style={btnSecondary}>
                ← Recommencer
              </button>
              <button onClick={handleAnalyze} style={btnPrimary}>
                Lancer l'analyse en profondeur →
              </button>
            </div>
          </div>
        )}

        {/* Analyzing */}
        {step === "analyzing" && (
          <div style={cardStyle}>
            <LoadingIndicator messages={LOADING_MESSAGES_ANALYSIS} />
          </div>
        )}

        {/* Result */}
        {step === "result" && (
          <div>
            <div style={{ ...cardStyle, marginBottom: 20 }}>
              <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: `1px solid ${THEME.cardBorder}` }}>
                <p style={{ color: THEME.accent, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                  Lecture complète
                </p>
                <h2
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 28,
                    color: THEME.accentLight,
                    fontWeight: 500,
                    margin: "0 0 8px",
                  }}
                >
                  {chartData?.type} — Profil {chartData?.profile}
                </h2>
                <p style={{ color: THEME.textMuted, fontSize: 14 }}>
                  {chartData?.incarnation_cross}
                </p>
              </div>
              {formatAnalysis(analysis)}
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
              <button onClick={handleReset} style={btnSecondary}>
                ← Nouvelle lecture
              </button>
              <button onClick={handlePrint} style={btnPrimary}>
                Sauvegarder en PDF
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 60, paddingBottom: 20 }}>
          <p style={{ color: THEME.textDark, fontSize: 12 }}>
            Propulsé par Claude · Lecture à titre indicatif
          </p>
        </div>
      </div>
    </div>
  );
}
