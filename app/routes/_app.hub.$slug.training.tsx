import { useOutletContext, useParams, useFetcher } from "react-router";
import type { Route } from "./+types/_app.hub.$slug.training";
import { createSupabaseServerClient } from "../lib/supabase.server";
import { useState, useRef, useEffect } from "react";

export async function action({ request, params }: Route.ActionArgs) {
  const { supabase } = createSupabaseServerClient(request);
  const form = await request.formData();
  const intent = form.get("intent");
  const { data: client } = await supabase.from("msg_clients").select("id").eq("slug", params.slug).single();
  if (!client) return { error: "Client not found" };

  if (intent === "test_message") {
    // Generate a test AI response using the same prompt assembly
    const message = form.get("message") as string;
    const contactName = form.get("contact_name") as string || "Test Lead";
    const location = form.get("location") as string || "";
    const channel = form.get("channel") as string || "SMS";
    const testProfile = form.get("profile") as string || "promo";
    const history = form.get("history") as string || "[]";

    // Fetch client config
    const [brandRes, offersRes, locationsRes, faqsRes, servicesRes, blockedRes, trainingRes] = await Promise.all([
      supabase.from("msg_brand_config").select("*").eq("client_id", client.id).single(),
      supabase.from("msg_offers").select("*").eq("client_id", client.id).eq("is_active", true),
      supabase.from("msg_locations").select("*").eq("client_id", client.id).eq("is_active", true),
      supabase.from("msg_faqs").select("*").eq("client_id", client.id).eq("is_active", true).order("times_used", { ascending: false }),
      supabase.from("msg_services").select("*").eq("client_id", client.id).eq("is_active", true),
      supabase.from("msg_blocked_topics").select("*").eq("client_id", client.id),
      supabase.from("msg_training_examples").select("*").eq("client_id", client.id).eq("is_active", true),
    ]);

    const brand = brandRes.data || {};
    const offers = offersRes.data || [];
    const locations = locationsRes.data || [];
    const faqs = faqsRes.data || [];
    const services = servicesRes.data || [];
    const blocked = blockedRes.data || [];
    const training = trainingRes.data || [];

    // Build system prompt (simplified version matching the engine)
    const assistantName = brand.assistant_name || "Assistant";
    const clientName = (await supabase.from("msg_clients").select("name").eq("id", client.id).single()).data?.name || "Client";

    // Filter FAQs and training by profile
    const profileFaqs = faqs.filter((f: any) => !f.profile || f.profile === "shared" || f.profile === testProfile);
    const profileTraining = training.filter((t: any) => !t.profile || t.profile === "shared" || t.profile === testProfile);

    let prompt = `# ${assistantName} - AI Messaging Assistant for ${clientName}\n\n`;
    if (testProfile === "general") {
      prompt += `You are ${assistantName}, a ${brand.tone || "friendly"} messaging assistant for ${clientName}.\n`;
      prompt += `You respond to people who message us on Facebook or Instagram with general enquiries about our services.\n`;
      prompt += `You should be helpful but conservative. If you are not sure about the answer, escalate rather than guess.\n`;
      prompt += `Use the general booking link when directing people to book, not the promo link.\n\n`;
      prompt += `## Location Clarification (IMPORTANT)\n`;
      prompt += `We have multiple locations. Before providing any booking link or address:\n`;
      prompt += `1. Check if the lead has already mentioned a location in the conversation.\n`;
      prompt += `2. If yes, use that location's details and general booking link.\n`;
      prompt += `3. If no, ask which location they prefer. Keep it natural, e.g. "We have two locations — Aitkenvale and Fairfield. Which one works best for you?"\n`;
      prompt += `4. Do NOT guess or default to a location. Always clarify first.\n\n`;
    } else {
      prompt += `You are ${assistantName}, a ${brand.tone || "friendly"} messaging assistant for ${clientName}.\n`;
      prompt += `You respond to leads who have enquired about our services.\n\n`;
    }
    prompt += `## CRITICAL SAFETY RULES\n`;
    prompt += `- You are ${assistantName}. NEVER say you are an AI, chatbot, bot, or automated system.\n`;
    prompt += `- NEVER reference any other business outside ${clientName}.\n`;
    prompt += `- NEVER share personal information about the business owner, staff, or other leads.\n`;
    prompt += `- NEVER provide medical advice. Escalate immediately.\n`;
    prompt += `- NEVER fabricate information.\n\n`;

    if (blocked.length > 0) {
      prompt += `## BLOCKED TOPICS\n`;
      blocked.forEach((b: any) => { prompt += `- ${b.topic}: ${b.reason || ""}\n`; });
      prompt += `\n`;
    }

    prompt += `## Communication Style\n`;
    prompt += `- Tone: ${brand.tone || "friendly"}\n`;
    prompt += `- First contact greeting: ${brand.greeting_style || "Hi [name]"}\n`;
    prompt += `- Australian spelling throughout\n`;
    if (channel === "SMS") {
      prompt += `- Do NOT use emojis. Target 160 chars, max 306. GSM-7 encoding.\n`;
    } else {
      prompt += `- Emojis allowed in social media DMs.\n`;
    }
    prompt += `\n`;

    if (brand.phone_number) {
      prompt += `## Contact\n- Phone: ${brand.phone_number}\n\n`;
    }

    if (locations.length > 0) {
      prompt += `## Locations\n`;
      locations.forEach((loc: any) => {
        prompt += `### ${loc.name}\n`;
        if (loc.address) prompt += `- Address: ${loc.address}\n`;
        if (loc.booking_link) prompt += `- Promo booking link: ${loc.booking_link}\n`;
        if (loc.general_booking_link) prompt += `- General booking link: ${loc.general_booking_link}\n`;
      });
      prompt += `\n`;
    }

    if (offers.length > 0) {
      prompt += `## Current Offers\n`;
      offers.forEach((o: any) => {
        prompt += `### ${o.name}\n`;
        if (o.price) prompt += `- Price: ${o.price}\n`;
        if (o.description) prompt += `- ${o.description}\n`;
        if (o.terms) prompt += `- Terms: ${o.terms}\n`;
        if (o.one_per_customer) prompt += `- One per customer\n`;
      });
      prompt += `\n`;
    }

    if (services.length > 0) {
      prompt += `## Services\n`;
      services.forEach((s: any) => {
        let line = `- ${s.name}`;
        if (s.price_range) line += ` (${s.price_range})`;
        if (s.duration) line += ` | ${s.duration}`;
        prompt += line + `\n`;
      });
      prompt += `\n`;
    }

    // FAQs separated by response type
    const directFaqs = profileFaqs.filter((f: any) => !f.response_type || f.response_type === "direct");
    const escalateFaqs = profileFaqs.filter((f: any) => f.response_type === "escalate");
    const instructionFaqs = profileFaqs.filter((f: any) => f.response_type === "instruction");

    if (directFaqs.length > 0) {
      prompt += `## Frequently Asked Questions (Direct Responses)\n`;
      prompt += `Use these answers when the lead asks the matching question. Send the answer as your response.\n\n`;
      directFaqs.forEach((f: any) => {
        prompt += `**Q: ${f.question}**\nA: ${f.answer}\n\n`;
      });
    }

    if (escalateFaqs.length > 0) {
      prompt += `## Escalation Topics (DO NOT RESPOND — ESCALATE IMMEDIATELY)\n`;
      prompt += `If the lead asks about ANY of these topics, return ONLY: ESCALATE: [topic]. Do NOT send any message.\n\n`;
      escalateFaqs.forEach((f: any) => {
        prompt += `- **${f.question}** → ESCALATE immediately. Reason: ${f.answer}\n`;
      });
      prompt += `\n`;
    }

    if (instructionFaqs.length > 0) {
      prompt += `## FAQ Instructions (Rules, NOT text to send)\n`;
      instructionFaqs.forEach((f: any) => {
        prompt += `- When asked about **${f.question}**: ${f.answer}\n`;
      });
      prompt += `\n`;
    }

    // Training examples
    if (profileTraining.length > 0) {
      prompt += `## Training Examples (Follow These Closely)\n`;
      prompt += `These are verified correct responses. Match this style and approach:\n\n`;
      profileTraining.forEach((t: any) => {
        prompt += `Lead: "${t.inbound_text}"\n`;
        prompt += `Correct response: "${t.correct_response}"\n`;
        if (t.notes) prompt += `Note: ${t.notes}\n`;
        prompt += `\n`;
      });
    }

    prompt += `## Post-Booking Response\n`;
    prompt += `If a lead says they have booked, respond with: "${brand.post_booking_response || "Amazing, see you then!"}"\n`;
    prompt += `Do not confirm or check any booking details.\n\n`;

    prompt += `## Lead Declines\nIf a lead is not interested, return ONLY: MARK_LOST: Lead declined offer\n\n`;
    prompt += `## Escalation\nIf you cannot handle something, return: ESCALATE: [reason]\n`;

    // Build messages
    let parsedHistory: any[] = [];
    try { parsedHistory = JSON.parse(history); } catch {}

    const messages: any[] = [];
    parsedHistory.forEach((m: any) => {
      messages.push({ role: m.role, content: m.content });
    });
    messages.push({ role: "user", content: message });

    // Call AI via Supabase Edge Function (handles API auth)
    const supabaseUrl = process.env.SUPABASE_URL || "https://lavpnfluvywcjeiyuash.supabase.co";
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdnBuZmx1dnl3Y2plaXl1YXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MDEzODcsImV4cCI6MjA4OTE3NzM4N30.X_GTCS1TY8aA9UeF7s76KtMYFymii_gLRceqLP09Ep0";

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/ai-sandbox`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          system: prompt,
          messages,
        }),
      });
      const data = await res.json();
      if (data.error) return { error: data.error };
      if (!data.reply) return { error: "No response generated" };
      return { reply: data.reply, prompt_length: prompt.length };
    } catch (e: any) {
      return { error: `API error: ${e.message}` };
    }
  }

  if (intent === "save_correction") {
    const correctionType = (form.get("correction_type") as string) || "exact";
    const inboundText = (form.get("inbound_text") as string) || (correctionType === "instruction" ? "System rule" : "");
    const priority = correctionType === "instruction" ? 20 : 10;
    await supabase.from("msg_training_examples").insert({
      client_id: client.id,
      scenario: form.get("scenario") || null,
      inbound_text: inboundText,
      bad_response: form.get("bad_response") || null,
      correct_response: form.get("correct_response"),
      correction_type: correctionType,
      conversation_stage: form.get("conversation_stage") || "general",
      priority,
      notes: form.get("notes") || null,
      profile: form.get("profile") || "shared",
      source: form.get("source") || "sandbox",
      is_active: true,
    });
    return { saved: true };
  }

  if (intent === "delete_example") {
    await supabase.from("msg_training_examples").delete().eq("id", form.get("id"));
    return { deleted: true };
  }

  if (intent === "update_example") {
    const id = form.get("id") as string;
    const updates: any = {};
    if (form.get("inbound_text")) updates.inbound_text = form.get("inbound_text");
    if (form.get("correct_response")) updates.correct_response = form.get("correct_response");
    if (form.get("correction_type")) updates.correction_type = form.get("correction_type");
    if (form.get("notes") !== null) updates.notes = form.get("notes") || null;
    updates.requires_location = (form.get("correct_response") || "").toString().includes("[booking_link]");
    const SB_URL = "https://lavpnfluvywcjeiyuash.supabase.co";
    const SB_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdnBuZmx1dnl3Y2plaXl1YXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzYwMTM4NywiZXhwIjoyMDg5MTc3Mzg3fQ.DtJLCeAdfxABizPVJWZ_jZ9ma02g3dyj3dv1HaZbJ2g";
    const res = await fetch(`${SB_URL}/rest/v1/msg_training_examples?id=eq.${id}`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${SB_SERVICE_KEY}`, "apikey": SB_SERVICE_KEY, "Content-Type": "application/json", "Prefer": "return=minimal" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) return { error: "Failed to update" };
    return { updated: true };
  }

  if (intent === "rate_production") {
    const logId = form.get("log_id") as string;
    const rating = form.get("rating") as string;
    const SB_URL = "https://lavpnfluvywcjeiyuash.supabase.co";
    const SB_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdnBuZmx1dnl3Y2plaXl1YXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzYwMTM4NywiZXhwIjoyMDg5MTc3Mzg3fQ.DtJLCeAdfxABizPVJWZ_jZ9ma02g3dyj3dv1HaZbJ2g";

    // Mark the log as reviewed
    const reviewStatus = rating === "bad" ? "corrected" : rating === "dismissed" ? "dismissed" : "good";
    await fetch(`${SB_URL}/rest/v1/msg_conversation_logs?id=eq.${logId}`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${SB_SERVICE_KEY}`, "apikey": SB_SERVICE_KEY, "Content-Type": "application/json", "Prefer": "return=minimal" },
      body: JSON.stringify({ review_status: reviewStatus }),
    });

    if (rating === "bad") {
      // Save the correction as a training example
      await fetch(`${SB_URL}/rest/v1/msg_training_examples`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${SB_SERVICE_KEY}`, "apikey": SB_SERVICE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: client.id,
          inbound_text: form.get("inbound_text"),
          bad_response: form.get("bad_response"),
          correct_response: form.get("correct_response"),
          correction_type: form.get("correction_type") || "exact",
          conversation_stage: "general",
          priority: 10,
          requires_location: (form.get("correct_response") || "").toString().includes("[booking_link]"),
          notes: form.get("notes") || null,
          source: "production",
          is_active: true,
        }),
      });
    }
    return { rated: true };
  }

  return {};
}

export default function Training() {
  const { allClientData } = useOutletContext<{ allClientData: Record<string, any> }>();
  const { slug } = useParams();
  const data = allClientData[slug!] || {};
  const client = data.client || {};
  const locations = data.locations || [];
  const conversations = data.conversations?.logs || [];
  const fetcher = useFetcher();

  const [tab, setTab] = useState<"sandbox" | "examples" | "review">("sandbox");
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [contactName, setContactName] = useState("Sarah");
  const [selectedLocation, setSelectedLocation] = useState(locations[0]?.tag || "");
  const [channel, setChannel] = useState("SMS");
  const [testProfile, setTestProfile] = useState("promo");
  const [correcting, setCorrecting] = useState<number | null>(null);
  const [reviewingLog, setReviewingLog] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load training examples
  const [examples, setExamples] = useState<any[]>([]);
  const examplesFetcher = useFetcher();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Handle test response
  useEffect(() => {
    if (fetcher.data && (fetcher.data as any).reply) {
      setChatHistory(prev => [...prev, { role: "assistant", content: (fetcher.data as any).reply }]);
    }
  }, [fetcher.data]);

  const sendTestMessage = () => {
    if (!inputMsg.trim()) return;
    const newHistory = [...chatHistory, { role: "user", content: inputMsg }];
    setChatHistory(newHistory);

    const formData = new FormData();
    formData.set("intent", "test_message");
    formData.set("message", inputMsg);
    formData.set("contact_name", contactName);
    formData.set("location", selectedLocation);
    formData.set("channel", channel);
    formData.set("profile", testProfile);
    formData.set("history", JSON.stringify(chatHistory));
    fetcher.submit(formData, { method: "post" });

    setInputMsg("");
  };

  const resetChat = () => {
    setChatHistory([]);
    setCorrecting(null);
  };

  const saveCorrection = (idx: number, correctResponse: string, notes: string) => {
    const userMsg = chatHistory[idx - 1]?.content || "";
    const badResponse = chatHistory[idx]?.content || "";

    const formData = new FormData();
    formData.set("intent", "save_correction");
    formData.set("inbound_text", userMsg);
    formData.set("bad_response", badResponse);
    formData.set("correct_response", correctResponse);
    formData.set("notes", notes);
    formData.set("scenario", `${selectedLocation} | ${channel}`);
    formData.set("source", "sandbox");
    fetcher.submit(formData, { method: "post" });
    setCorrecting(null);
  };

  return (
    <div style={{ maxWidth: 800, width: "100%" }}>
      <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 24, color: "#3b3b3b", margin: 0 }}>AI Training</h1>
      <p style={{ color: "#8a8478", fontSize: 13, margin: "4px 0 24px" }}>{client.name}</p>

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#eee8dc", borderRadius: 8, padding: 4 }}>
        {[
          { key: "sandbox" as const, label: "Test Sandbox" },
          { key: "examples" as const, label: "Knowledge Base" },
          { key: "rules" as const, label: "System Rules" },
          { key: "review" as const, label: "Review Responses" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: "10px 16px", borderRadius: 6, border: "none", fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "'Montserrat', sans-serif",
            background: tab === t.key ? "#3b3b3b" : "transparent",
            color: tab === t.key ? "#f5f0e8" : "#5a5a5a",
            transition: "all 0.15s",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ==================== SANDBOX ==================== */}
      {tab === "sandbox" && (
        <div>
          {/* Settings bar */}
          <div style={{ background: "white", borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#8a8478", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Test Scenario</div>
            <div className="hub-grid-3" style={{ gap: 12 }}>
              <div>
                <label style={labelSm}>Lead Name</label>
                <input value={contactName} onChange={e => setContactName(e.target.value)} style={inputSm} />
              </div>
              <div>
                <label style={labelSm}>Location</label>
                <select value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)} style={inputSm}>
                  {locations.map((l: any) => <option key={l.tag} value={l.tag}>{l.name}</option>)}
                  {locations.length === 0 && <option value="">No locations</option>}
                </select>
              </div>
              <div>
                <label style={labelSm}>Channel</label>
                <select value={channel} onChange={e => setChannel(e.target.value)} style={inputSm}>
                  <option value="SMS">SMS</option>
                  <option value="FB">Facebook DM</option>
                  <option value="IG">Instagram DM</option>
                </select>
              </div>
              <div>
                <label style={labelSm}>Profile</label>
                <select value={testProfile} onChange={e => { setTestProfile(e.target.value); setChatHistory([]); }} style={{ ...inputSm, background: testProfile === "general" ? "#e8f5e9" : "#e3f2fd" }}>
                  <option value="promo">Promo Lead</option>
                  <option value="general">General Enquiry</option>
                </select>
              </div>
            </div>
          </div>

          {/* Chat area */}
          <div style={{
            background: "white", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            display: "flex", flexDirection: "column", minHeight: 400,
          }}>
            {/* Messages */}
            <div style={{ flex: 1, padding: 20, overflowY: "auto", maxHeight: 500 }}>
              {chatHistory.length === 0 && (
                <div style={{ textAlign: "center", color: "#b0a89a", fontSize: 13, padding: 40 }}>
                  Type a message below to test how the AI responds.
                  <br />Try different scenarios to check the responses are correct.
                </div>
              )}

              {chatHistory.map((msg, i) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{
                    display: "flex",
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  }}>
                    <div style={{
                      maxWidth: "80%",
                      padding: "10px 14px",
                      borderRadius: 12,
                      fontSize: 13,
                      lineHeight: 1.5,
                      background: msg.role === "user" ? "#3b3b3b" : "#f5f0e8",
                      color: msg.role === "user" ? "#f5f0e8" : "#3b3b3b",
                      borderBottomRightRadius: msg.role === "user" ? 4 : 12,
                      borderBottomLeftRadius: msg.role === "user" ? 12 : 4,
                    }}>
                      {msg.content}
                    </div>
                  </div>

                  {/* Rate AI responses */}
                  {msg.role === "assistant" && (
                    <div style={{ display: "flex", gap: 8, marginTop: 6, justifyContent: "flex-start" }}>
                      {correcting === i ? null : (
                        <>
                          <button onClick={() => {/* good - no action needed */}} style={rateBtn} title="Good response">
                            <span style={{ fontSize: 14 }}>&#x1F44D;</span>
                          </button>
                          <button onClick={() => setCorrecting(i)} style={rateBtn} title="Needs correction">
                            <span style={{ fontSize: 14 }}>&#x1F44E;</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Correction form */}
                  {correcting === i && (
                    <CorrectionForm
                      onSave={(correct, notes, correctionType) => saveCorrection(i, correct, notes, correctionType)}
                      onCancel={() => setCorrecting(null)}
                      badResponse={msg.content}
                    />
                  )}
                </div>
              ))}

              {fetcher.state === "submitting" && chatHistory[chatHistory.length - 1]?.role === "user" && (
                <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
                  <div style={{
                    padding: "10px 14px", borderRadius: 12, background: "#f5f0e8",
                    fontSize: 13, color: "#b0a89a", borderBottomLeftRadius: 4,
                  }}>
                    Typing...
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{ borderTop: "1px solid #eee8dc", padding: 16, display: "flex", gap: 8 }}>
              <input
                value={inputMsg}
                onChange={e => setInputMsg(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendTestMessage(); } }}
                placeholder={`Message as ${contactName}...`}
                style={{ flex: 1, padding: "10px 14px", border: "1px solid #ddd5c4", borderRadius: 8, fontSize: 13, fontFamily: "'Montserrat', sans-serif", outline: "none" }}
                disabled={fetcher.state === "submitting"}
              />
              <button onClick={sendTestMessage} disabled={fetcher.state === "submitting"} style={{
                padding: "10px 20px", background: "#3b3b3b", color: "#f5f0e8", border: "none",
                borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                fontFamily: "'Montserrat', sans-serif", opacity: fetcher.state === "submitting" ? 0.5 : 1,
              }}>Send</button>
              <button onClick={resetChat} style={{
                padding: "10px 14px", background: "#eee8dc", color: "#3b3b3b", border: "none",
                borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                fontFamily: "'Montserrat', sans-serif",
              }}>Reset</button>
            </div>
          </div>

          {(fetcher.data as any)?.saved && (
            <div style={{ marginTop: 12, padding: 12, background: "#e8f5e9", borderRadius: 8, fontSize: 13, color: "#2e7d32", fontWeight: 600 }}>
              Correction saved as a training example. The AI will learn from this.
            </div>
          )}
        </div>
      )}

      {/* ==================== TRAINING EXAMPLES ==================== */}
      {tab === "examples" && (
        <TrainingExamples slug={slug!} />
      )}

      {/* ==================== SYSTEM RULES ==================== */}
      {tab === "rules" && (
        <SystemRules slug={slug!} />
      )}

      {/* ==================== REVIEW PRODUCTION ==================== */}
      {tab === "review" && (
        <div>
          <p style={{ fontSize: 13, color: "#8a8478", marginBottom: 16 }}>Review real AI responses and flag ones that need correction. Corrections become training examples.</p>

          {(() => {
            const unreviewed = conversations.filter((l: any) => l.action === "responded" && l.outbound_text && !l.review_status);
            if (unreviewed.length === 0) return (
              <div style={{ background: "white", borderRadius: 12, padding: 40, textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: 13, color: "#8a8478" }}>All responses have been reviewed. New responses will appear here as the engine handles leads.</div>
              </div>
            );
            return (<><div style={{ fontSize: 12, color: "#8a8478", marginBottom: 12 }}>{unreviewed.length} response{unreviewed.length !== 1 ? "s" : ""} to review</div>{unreviewed.map((log: any) => (
            <div key={log.id} style={{ background: "white", borderRadius: 12, padding: 16, marginBottom: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 11, color: "#8a8478", marginBottom: 8 }}>
                {log.contact_name} | {log.location_tag} | {(log.channel || "").replace("TYPE_", "")} | {new Date(log.created_at).toLocaleString("en-AU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </div>
              <div style={{ background: "#faf8f5", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: "#8a8478", marginBottom: 2 }}>Lead:</div>
                <div style={{ fontSize: 13, color: "#3b3b3b" }}>{log.inbound_text}</div>
              </div>
              <div style={{ background: "#f0f7f0", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: "#8a8478", marginBottom: 2 }}>AI replied:</div>
                <div style={{ fontSize: 13, color: "#3b3b3b" }}>{log.outbound_text}</div>
              </div>

              {reviewingLog === log.id ? (
                <CorrectionForm
                  onSave={(correct, notes, correctionType) => {
                    const formData = new FormData();
                    formData.set("intent", "rate_production");
                    formData.set("log_id", log.id);
                    formData.set("rating", "bad");
                    formData.set("inbound_text", log.inbound_text);
                    formData.set("bad_response", log.outbound_text);
                    formData.set("correct_response", correct);
                    formData.set("correction_type", correctionType);
                    formData.set("notes", notes);
                    fetcher.submit(formData, { method: "post" });
                    setReviewingLog(null);
                  }}
                  onCancel={() => setReviewingLog(null)}
                  badResponse={log.outbound_text}
                />
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => {
                    const formData = new FormData();
                    formData.set("intent", "rate_production");
                    formData.set("log_id", log.id);
                    formData.set("rating", "good");
                    fetcher.submit(formData, { method: "post" });
                  }} style={{ ...rateBtn, fontSize: 12, padding: "6px 12px", background: "#e8f5e9", color: "#2e7d32" }} title="Good response">Good</button>
                  <button onClick={() => setReviewingLog(log.id)} style={{ ...rateBtn, fontSize: 12, padding: "6px 12px", background: "#ffebee", color: "#c62828" }} title="Needs correction">Needs Correction</button>
                  <button onClick={() => {
                    const formData = new FormData();
                    formData.set("intent", "rate_production");
                    formData.set("log_id", log.id);
                    formData.set("rating", "dismissed");
                    fetcher.submit(formData, { method: "post" });
                  }} style={{ ...rateBtn, fontSize: 12, padding: "6px 12px", background: "#f5f5f5", color: "#999" }} title="Ignore this response">Ignore</button>
                </div>
              )}
            </div>
          ))}</>);
          })()}
        </div>
      )}
    </div>
  );
}

// ==================== CORRECTION FORM ====================
function CorrectionForm({ onSave, onCancel, badResponse }: { onSave: (correct: string, notes: string, correctionType: string) => void; onCancel: () => void; badResponse: string }) {
  const [correct, setCorrect] = useState("");
  const [notes, setNotes] = useState("");
  const [correctionType, setCorrectionType] = useState<"exact" | "instruction">("exact");

  const toggleStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: "6px 12px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 600,
    cursor: "pointer", fontFamily: "'Montserrat', sans-serif", transition: "all 0.15s",
    background: active ? "#3b3b3b" : "transparent",
    color: active ? "#f5f0e8" : "#8a8478",
  });

  return (
    <div style={{ background: "#fff8f0", borderRadius: 8, padding: 14, marginTop: 8, border: "1px solid #ffe0b2" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#ef6c00", marginBottom: 8 }}>What should the AI have said instead?</div>
      <div style={{ display: "flex", gap: 2, marginBottom: 10, background: "#eee8dc", borderRadius: 6, padding: 3 }}>
        <button onClick={() => setCorrectionType("exact")} style={toggleStyle(correctionType === "exact")}>Exact Response</button>
        <button onClick={() => setCorrectionType("instruction")} style={toggleStyle(correctionType === "instruction")}>Instruction</button>
      </div>
      <div style={{ fontSize: 11, color: "#8a8478", marginBottom: 6 }}>
        {correctionType === "exact"
          ? "Type the exact response the AI should use (word for word)."
          : "Give the AI guidance on what to do differently (e.g. don't mention deposits, keep it shorter, etc)."}
      </div>
      <textarea
        value={correct}
        onChange={e => setCorrect(e.target.value)}
        placeholder={correctionType === "exact" ? "Type the correct response..." : "e.g. Keep the response shorter and don't repeat the offer details..."}
        rows={3}
        style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd5c4", borderRadius: 6, fontSize: 13, fontFamily: "'Montserrat', sans-serif", background: "white", boxSizing: "border-box", resize: "vertical", marginBottom: 8 }}
      />
      <input
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Why is this better? (optional)"
        style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd5c4", borderRadius: 6, fontSize: 13, fontFamily: "'Montserrat', sans-serif", background: "white", boxSizing: "border-box", marginBottom: 8 }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => { if (correct.trim()) onSave(correct.trim(), notes.trim(), correctionType); }} style={{
          padding: "8px 16px", background: "#2e7d32", color: "white", border: "none", borderRadius: 6,
          fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif",
        }}>Save Correction</button>
        <button onClick={onCancel} style={{
          padding: "8px 16px", background: "#f5f5f5", color: "#666", border: "none", borderRadius: 6,
          fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif",
        }}>Cancel</button>
      </div>
    </div>
  );
}

// ==================== TRAINING EXAMPLES LIST ====================
function TrainingExamples({ slug }: { slug: string }) {
  const { allClientData } = useOutletContext<{ allClientData: Record<string, any> }>();
  const data = allClientData[slug] || {};
  const allExamples = data.trainingExamples || [];
  // Filter out instructions -- those show in System Rules tab
  const examples = allExamples.filter((e: any) => e.correction_type !== "instruction");
  const fetcher = useFetcher();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [profileFilter, setProfileFilter] = useState<string>("all");
  const filteredExamples = profileFilter === "all" ? examples : examples.filter((e: any) => e.profile === profileFilter);

  const sourceLabels: Record<string, { bg: string; color: string; label: string }> = {
    sandbox: { bg: "#e3f2fd", color: "#1565c0", label: "Sandbox" },
    production: { bg: "#fff3e0", color: "#ef6c00", label: "Review" },
    manual: { bg: "#eee8dc", color: "#3b3b3b", label: "Manual" },
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: "#8a8478", flex: 1, marginRight: 16 }}>
          Training examples teach the AI how to respond correctly. Each correction you make in the sandbox or from reviewing production responses appears here.
        </p>
        <button onClick={() => setShowAdd(!showAdd)} style={{ ...btnPrimary, whiteSpace: "nowrap" }}>{showAdd ? "Cancel" : "Add Example"}</button>
      </div>

      {/* Profile filter */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "#eee8dc", borderRadius: 8, padding: 4 }}>
        {[{ key: "all", label: "All" }, { key: "shared", label: "Shared" }, { key: "promo", label: "Promo" }, { key: "general", label: "General" }].map(t => (
          <button key={t.key} onClick={() => setProfileFilter(t.key)} style={{
            flex: 1, padding: "6px 10px", borderRadius: 6, border: "none", fontSize: 11, fontWeight: 600,
            cursor: "pointer", fontFamily: "'Montserrat', sans-serif",
            background: profileFilter === t.key ? "#3b3b3b" : "transparent",
            color: profileFilter === t.key ? "#f5f0e8" : "#5a5a5a",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {showAdd && (
        <div style={{ background: "white", borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <fetcher.Form method="post" onSubmit={() => setShowAdd(false)}>
            <input type="hidden" name="intent" value="save_correction" />
            <input type="hidden" name="source" value="manual" />
            <div style={{ marginBottom: 12 }}>
              <label style={labelSm}>Type</label>
              <select name="correction_type" defaultValue="exact" style={inputFull} onChange={(e) => {
                const trigger = document.getElementById('kb-trigger-field') as HTMLElement;
                if (trigger) trigger.style.display = e.target.value === 'instruction' ? 'none' : 'block';
              }}>
                <option value="exact">Exact Response (when lead says X, respond with Y)</option>
                <option value="instruction">Instruction (general rule for the AI to follow)</option>
              </select>
            </div>
            <div id="kb-trigger-field" style={{ marginBottom: 12 }}>
              <label style={labelSm}>When the lead says</label>
              <input name="inbound_text" placeholder='e.g. "How much does it cost?"' style={inputFull} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelSm}>Response / Instruction</label>
              <textarea name="correct_response" required rows={3} placeholder="Type the exact response or instruction for the AI..." style={{ ...inputFull, resize: "vertical" }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelSm}>Notes (optional)</label>
              <input name="notes" placeholder="Why this response or rule exists" style={inputFull} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelSm}>Profile</label>
              <select name="profile" defaultValue="shared" style={inputFull}>
                <option value="shared">Shared (both profiles)</option>
                <option value="promo">Promo only</option>
                <option value="general">General only</option>
              </select>
            </div>
            <button type="submit" style={btnPrimary}>Save</button>
          </fetcher.Form>
        </div>
      )}

      {filteredExamples.length === 0 && (
        <div style={{ background: "white", borderRadius: 12, padding: 40, textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 13, color: "#8a8478" }}>No training examples yet. Use the sandbox to test responses and correct any that need fixing.</div>
        </div>
      )}

      {filteredExamples.map((ex: any) => {
        const src = sourceLabels[ex.source] || sourceLabels.manual;

        if (editingId === ex.id) {
          return (
            <div key={ex.id} style={{ background: "#faf8f5", borderRadius: 12, padding: 20, marginBottom: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "2px solid #c4a882" }}>
              <fetcher.Form method="post" onSubmit={() => setEditingId(null)}>
                <input type="hidden" name="intent" value="update_example" />
                <input type="hidden" name="id" value={ex.id} />
                <div style={{ marginBottom: 10 }}>
                  <label style={labelSm}>When the lead says</label>
                  <input name="inbound_text" defaultValue={ex.inbound_text} style={inputFull} />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={labelSm}>Type</label>
                  <select name="correction_type" defaultValue={ex.correction_type || "exact"} style={inputFull}>
                    <option value="exact">Exact Response</option>
                    <option value="instruction">Instruction</option>
                  </select>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={labelSm}>Response / Instruction</label>
                  <textarea name="correct_response" defaultValue={ex.correct_response} rows={3} style={{ ...inputFull, resize: "vertical" }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelSm}>Notes (optional)</label>
                  <input name="notes" defaultValue={ex.notes || ""} style={inputFull} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit" style={btnPrimary}>Save</button>
                  <button type="button" onClick={() => setEditingId(null)} style={{ ...btnPrimary, background: "#eee8dc", color: "#3b3b3b" }}>Cancel</button>
                </div>
              </fetcher.Form>
            </div>
          );
        }

        return (
          <div key={ex.id} style={{ background: "white", borderRadius: 12, padding: 16, marginBottom: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", borderLeft: "3px solid #c4a882" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 600, background: src.bg, color: src.color }}>{src.label}</span>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setEditingId(ex.id)} style={{ background: "none", border: "none", color: "#1565c0", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Edit</button>
                <fetcher.Form method="post" style={{ display: "inline" }} onSubmit={(e) => { if (!confirm("Delete this training example?")) e.preventDefault(); }}>
                  <input type="hidden" name="intent" value="delete_example" />
                  <input type="hidden" name="id" value={ex.id} />
                  <button type="submit" style={{ background: "none", border: "none", color: "#c62828", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Delete</button>
                </fetcher.Form>
              </div>
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: "#8a8478", marginBottom: 2 }}>Lead says:</div>
              <div style={{ fontSize: 13, color: "#3b3b3b", fontWeight: 500 }}>{ex.inbound_text}</div>
            </div>

            <div style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 11, color: ex.correction_type === "instruction" ? "#7b1fa2" : "#2e7d32", marginBottom: 2 }}>
                {ex.correction_type === "instruction" ? "Instruction:" : "Correct response:"}
              </div>
              <div style={{ fontSize: 13, color: "#3b3b3b", fontStyle: ex.correction_type === "instruction" ? "italic" : "normal" }}>{ex.correct_response}</div>
            </div>

            {ex.notes && (
              <div style={{ fontSize: 12, color: "#8a8478", marginTop: 6, fontStyle: "italic" }}>{ex.notes}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ==================== SYSTEM RULES ====================
function SystemRules({ slug }: { slug: string }) {
  const { allClientData } = useOutletContext<{ allClientData: Record<string, any> }>();
  const data = allClientData[slug] || {};
  const examples = data.trainingExamples || [];
  const fetcher = useFetcher();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // System rules are instruction-type training examples
  const rules = examples.filter((e: any) => e.correction_type === "instruction");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: "#8a8478", flex: 1, marginRight: 16 }}>
          System rules control how the AI behaves. These are behavioural instructions that override other responses. Use these for things like "never mention deposits unless asked" or "always escalate sensitive topics".
        </p>
        <button onClick={() => setShowAdd(!showAdd)} style={{ ...btnPrimary, whiteSpace: "nowrap" }}>{showAdd ? "Cancel" : "Add Rule"}</button>
      </div>

      {showAdd && (
        <div style={{ background: "white", borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <fetcher.Form method="post" onSubmit={() => setShowAdd(false)}>
            <input type="hidden" name="intent" value="save_correction" />
            <input type="hidden" name="source" value="manual" />
            <input type="hidden" name="correction_type" value="instruction" />
            <input type="hidden" name="conversation_stage" value="general" />
            <input type="hidden" name="priority" value="20" />
            <input type="hidden" name="inbound_text" value="System rule" />
            <div style={{ marginBottom: 12 }}>
              <label style={labelSm}>Rule</label>
              <textarea name="correct_response" required rows={3} placeholder="e.g. Never mention deposits unless the lead specifically asks about payment..." style={{ ...inputFull, resize: "vertical" }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelSm}>Notes (optional)</label>
              <input name="notes" placeholder="Why this rule exists" style={inputFull} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelSm}>Profile</label>
              <select name="profile" defaultValue="shared" style={inputFull}>
                <option value="shared">Shared (both profiles)</option>
                <option value="promo">Promo only</option>
                <option value="general">General only</option>
              </select>
            </div>
            <button type="submit" style={btnPrimary}>Save Rule</button>
          </fetcher.Form>
        </div>
      )}

      {rules.length === 0 && !showAdd && (
        <div style={{ background: "white", borderRadius: 12, padding: 40, textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 13, color: "#8a8478" }}>No system rules yet. Add rules to control how the AI behaves.</div>
        </div>
      )}

      {rules.map((rule: any) => {
        if (editingId === rule.id) {
          return (
            <div key={rule.id} style={{ background: "#faf8f5", borderRadius: 12, padding: 20, marginBottom: 10, border: "2px solid #7b1fa2" }}>
              <fetcher.Form method="post" onSubmit={() => setEditingId(null)}>
                <input type="hidden" name="intent" value="update_example" />
                <input type="hidden" name="id" value={rule.id} />
                <input type="hidden" name="correction_type" value="instruction" />
                <div style={{ marginBottom: 10 }}>
                  <label style={labelSm}>Rule</label>
                  <textarea name="correct_response" defaultValue={rule.correct_response} rows={3} style={{ ...inputFull, resize: "vertical" }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelSm}>Notes</label>
                  <input name="notes" defaultValue={rule.notes || ""} style={inputFull} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit" style={btnPrimary}>Save</button>
                  <button type="button" onClick={() => setEditingId(null)} style={{ ...btnPrimary, background: "#eee8dc", color: "#3b3b3b" }}>Cancel</button>
                </div>
              </fetcher.Form>
            </div>
          );
        }
        return (
          <div key={rule.id} style={{ background: "white", borderRadius: 12, padding: 16, marginBottom: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", borderLeft: "3px solid #7b1fa2" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: "#3b3b3b", fontStyle: "italic" }}>{rule.correct_response}</div>
                {rule.notes && <div style={{ fontSize: 12, color: "#8a8478", marginTop: 6 }}>{rule.notes}</div>}
              </div>
              <div style={{ display: "flex", gap: 10, flexShrink: 0, marginLeft: 12 }}>
                <button onClick={() => setEditingId(rule.id)} style={{ background: "none", border: "none", color: "#1565c0", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Edit</button>
                <fetcher.Form method="post" style={{ display: "inline" }} onSubmit={(e) => { if (!confirm("Delete this rule?")) e.preventDefault(); }}>
                  <input type="hidden" name="intent" value="delete_example" />
                  <input type="hidden" name="id" value={rule.id} />
                  <button type="submit" style={{ background: "none", border: "none", color: "#c62828", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Delete</button>
                </fetcher.Form>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const labelSm: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 600, color: "#8a8478", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 };
const inputSm: React.CSSProperties = { width: "100%", padding: "8px 10px", border: "1px solid #ddd5c4", borderRadius: 6, fontSize: 13, fontFamily: "'Montserrat', sans-serif", background: "#faf8f5", boxSizing: "border-box" as any };
const inputFull: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1px solid #ddd5c4", borderRadius: 6, fontSize: 13, fontFamily: "'Montserrat', sans-serif", background: "#faf8f5", boxSizing: "border-box" as any };
const rateBtn: React.CSSProperties = { padding: "4px 8px", background: "#eee8dc", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontFamily: "'Montserrat', sans-serif" };
const btnPrimary: React.CSSProperties = { padding: "10px 20px", background: "#3b3b3b", color: "#f5f0e8", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Montserrat', sans-serif" };
