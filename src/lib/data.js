import { supabase } from "./supabaseClient";

function formatLocalDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const ZERO_METAS = {
  toursRealizados: { target: 0, actual: 0, periodo: "mes" },
  leadsDocumentacion: { target: 0, actual: 0, periodo: "mes" },
  ventasCerradas: { target: 0, actual: 0, periodo: "mes" },
  ventasEscritura: { target: 0, actual: 0, periodo: "mes" },
};

function metasToShape(m) {
  if (!m) return ZERO_METAS;
  return {
    toursRealizados: { target: m.tours_realizados_target ?? 0, actual: m.tours_realizados_actual ?? 0, periodo: m.periodo },
    leadsDocumentacion: { target: m.leads_documentacion_target ?? 0, actual: m.leads_documentacion_actual ?? 0, periodo: m.periodo },
    ventasCerradas: { target: m.ventas_cerradas_target ?? 0, actual: m.ventas_cerradas_actual ?? 0, periodo: m.periodo },
    ventasEscritura: { target: m.ventas_escritura_target ?? 0, actual: m.ventas_escritura_actual ?? 0, periodo: m.periodo },
  };
}

export async function fetchProfileByAuthUserId(authUserId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("auth_user_id", authUserId).single();
  if (error) throw error;
  return { id: data.id, name: data.name, email: data.email, phone: data.phone, photo: data.photo_url, role: data.role, canBlockUnits: data.can_block_units };
}

export async function fetchAsesores() {
  const { data: profiles, error } = await supabase.from("profiles").select("*").eq("role", "vendedor").order("turno");
  if (error) throw error;
  const { data: metas, error: metasError } = await supabase.from("metas").select("*");
  if (metasError) throw metasError;
  const metasByAsesor = Object.fromEntries(metas.map((m) => [m.asesor_id, m]));
  return profiles.map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    phone: p.phone,
    turno: p.turno,
    activo: p.activo,
    tiempo_resp: p.tiempo_resp,
    conversion: p.conversion,
    canBlockUnits: p.can_block_units,
    metas: metasToShape(metasByAsesor[p.id]),
  }));
}

export async function setAsesorCanBlockUnits(id, canBlockUnits) {
  const { error } = await supabase.from("profiles").update({ can_block_units: canBlockUnits }).eq("id", id);
  if (error) throw error;
}

export async function fetchLeads() {
  const { data, error } = await supabase
    .from("leads")
    .select("*, asesor:asesor_id(name), broker:broker_id(name), unit:unit_id(number), historia:lead_historia(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((l) => ({
    id: l.id,
    name: l.name,
    phone: l.phone,
    source: l.source,
    stage: l.stage,
    asesor: l.asesor?.name ?? null,
    broker: l.broker?.name ?? null,
    created: new Date(l.created_at).getTime(),
    lastActivity: new Date(l.last_activity_at).getTime(),
    campaign: l.campaign,
    interes: l.interes,
    razon: l.razon,
    unidad: l.unit?.number ?? null,
    historia: (l.historia || [])
      .slice()
      .sort((a, b) => new Date(a.ts) - new Date(b.ts))
      .map((h) => ({ ts: new Date(h.ts).getTime(), action: h.action, note: h.note, by: h.by })),
    _asesorId: l.asesor_id,
    _brokerId: l.broker_id,
  }));
}

export async function fetchUnits() {
  const { data, error } = await supabase
    .from("units")
    .select("*, tower:tower_id(name, order_index), lead:lead_id(name), blockedByProfile:blocked_by(name)")
    .order("number");
  if (error) throw error;
  return data
    .sort((a, b) => (a.tower?.order_index ?? 0) - (b.tower?.order_index ?? 0) || a.number.localeCompare(b.number))
    .map((u) => ({
      num: u.number,
      model: u.model,
      torre: (u.tower?.name || "").replace("Torre ", ""),
      status: u.status,
      price: Number(u.price),
      lead: u.lead?.name,
      vence: u.bloqueo_expira_at ? formatLocalDate(new Date(u.bloqueo_expira_at)) : undefined,
      bloqueoExpiraAt: u.bloqueo_expira_at ? new Date(u.bloqueo_expira_at).getTime() : null,
      soldAt: u.sold_at ? new Date(u.sold_at).getTime() : null,
      escrituraStatus: u.escritura_status ?? null,
      escrituraCompletedAt: u.escritura_completed_at ? new Date(u.escritura_completed_at).getTime() : null,
      entregadaAt: u.entregada_at ? new Date(u.entregada_at).getTime() : null,
      compradorNombre: u.comprador_nombre ?? null,
      m2: u.m2 != null ? Number(u.m2) : null,
      habitaciones: u.habitaciones != null ? Number(u.habitaciones) : null,
      banos: u.banos != null ? Number(u.banos) : null,
      description: u.description ?? "",
      notes: u.notes ?? "",
      blockedReason: u.blocked_reason ?? null,
      blockedBy: u.blockedByProfile?.name ?? null,
      blockedAt: u.blocked_at ? new Date(u.blocked_at).getTime() : null,
      vendedorBlockAllowed: u.vendedor_block_allowed,
      _id: u.id,
      _towerId: u.tower_id,
    }));
}

export async function updateUnit(id, fields) {
  const payload = {};
  if (fields.model !== undefined) payload.model = fields.model;
  if (fields.price !== undefined) payload.price = fields.price;
  if (fields.m2 !== undefined) payload.m2 = fields.m2 === "" ? null : fields.m2;
  if (fields.habitaciones !== undefined) payload.habitaciones = fields.habitaciones === "" ? null : Number(fields.habitaciones);
  if (fields.banos !== undefined) payload.banos = fields.banos === "" ? null : Number(fields.banos);
  if (fields.description !== undefined) payload.description = fields.description;
  if (fields.notes !== undefined) payload.notes = fields.notes;
  if (fields.vendedorBlockAllowed !== undefined) payload.vendedor_block_allowed = fields.vendedorBlockAllowed;
  if (fields.compradorNombre !== undefined) payload.comprador_nombre = fields.compradorNombre || null;
  if (fields.status !== undefined) payload.status = fields.status;
  if (fields.soldAt !== undefined) payload.sold_at = fields.soldAt;
  if (fields.escrituraStatus !== undefined) payload.escritura_status = fields.escrituraStatus;
  if (fields.escrituraCompletedAt !== undefined) payload.escritura_completed_at = fields.escrituraCompletedAt;
  if (fields.entregadaAt !== undefined) payload.entregada_at = fields.entregadaAt;
  const { error } = await supabase.from("units").update(payload).eq("id", id);
  if (error) throw error;
}

export async function insertUnit({ towerId, number, model, price, m2, habitaciones, banos, description }) {
  const { error } = await supabase.from("units").insert({
    tower_id: towerId, number, model, price: price || null,
    m2: m2 || null, habitaciones: habitaciones || null, banos: banos || null,
    description: description || null, status: "disponible", vendedor_block_allowed: true,
  });
  if (error) throw error;
}

export async function deleteUnit(id) {
  const { error } = await supabase.from("units").delete().eq("id", id);
  if (error) throw error;
}

export async function updateTower(id, fields) {
  const payload = {};
  if (fields.name !== undefined) payload.name = fields.name;
  if (fields.status !== undefined) payload.status = fields.status;
  if (fields.construction_pct !== undefined) payload.construction_pct = fields.construction_pct;
  const { error } = await supabase.from("towers").update(payload).eq("id", id);
  if (error) throw error;
}

export async function insertTower({ name, status, constructionPct, orderIndex }) {
  const { error } = await supabase.from("towers").insert({
    name, status: status || "preventa",
    construction_pct: constructionPct || 0,
    order_index: orderIndex || 99,
  });
  if (error) throw error;
}

export async function blockUnit(id, reason, until) {
  const { error } = await supabase.rpc("block_unit_as_vendedor", { p_unit_id: id, p_reason: reason, p_until: until });
  if (error) throw error;
}

export async function reassignLeadAsesor(leadId, newAsesorId, oldName, newName, byName) {
  const { error } = await supabase.from("leads").update({ asesor_id: newAsesorId }).eq("id", leadId);
  if (error) throw error;
  const { error: histError } = await supabase.from("lead_historia").insert({
    lead_id: leadId,
    action: "Asesor reasignado",
    note: oldName ? `De ${oldName} → ${newName}` : `Asignado a ${newName}`,
    by: byName,
  });
  if (histError) throw histError;
}

export async function unblockUnit(id) {
  const { error } = await supabase
    .from("units")
    .update({ status: "disponible", blocked_reason: null, blocked_by: null, blocked_at: null, bloqueo_expira_at: null })
    .eq("id", id);
  if (error) throw error;
}

export async function insertLead({ name, phone, source, campaign, interes, notes, asesorId, authorName }) {
  const { data: lead, error } = await supabase
    .from("leads")
    .insert({ name, phone, source, campaign: campaign || null, interes: interes || null, stage: "nuevo", asesor_id: asesorId || null })
    .select()
    .single();
  if (error) throw error;
  const { error: histError } = await supabase.from("lead_historia").insert({
    lead_id: lead.id,
    action: "Lead creado",
    note: `Ingresado manualmente${notes ? ` · ${notes}` : ""}`,
    by: authorName,
  });
  if (histError) throw histError;
  return lead.id;
}

export async function insertAsesor({ name, email, phone, turno }) {
  const { data, error } = await supabase
    .from("profiles")
    .insert({ name, email, phone, role: "vendedor", turno, activo: true })
    .select()
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateAsesor(id, { name, email, phone }) {
  const { error } = await supabase.from("profiles").update({ name, email, phone }).eq("id", id);
  if (error) throw error;
}

export async function setAsesorActivo(id, activo) {
  const { error } = await supabase.from("profiles").update({ activo }).eq("id", id);
  if (error) throw error;
}

export async function swapTurnos(idA, turnoA, idB, turnoB) {
  const { error: e1 } = await supabase.from("profiles").update({ turno: turnoB }).eq("id", idA);
  if (e1) throw e1;
  const { error: e2 } = await supabase.from("profiles").update({ turno: turnoA }).eq("id", idB);
  if (e2) throw e2;
}

export async function updateOwnProfile(id, { name, email, phone, photo }) {
  const { error } = await supabase.from("profiles").update({ name, email, phone, photo_url: photo }).eq("id", id);
  if (error) throw error;
}

export async function fetchTowers() {
  const { data, error } = await supabase
    .from('towers').select('*').order('order_index');
  if (error) throw error;
  return data;
}

export async function fetchMarketingSpend() {
  const { data, error } = await supabase
    .from('marketing_spend').select('*').order('month', { ascending: false });
  if (error) throw error;
  return data;
}

export async function upsertMarketingSpend(source, month, amount, notes = '') {
  const { error } = await supabase
    .from('marketing_spend')
    .upsert({ source, month, amount, notes }, { onConflict: 'source,month' });
  if (error) throw error;
}

export async function fetchProjectConfig() {
  const { data, error } = await supabase.from('project_config').select('*');
  if (error) throw error;
  return data.reduce((acc, r) => ({ ...acc, [r.key]: r.value }), {});
}

export async function upsertProjectConfig(key, value) {
  const { error } = await supabase
    .from('project_config')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) throw error;
}

export async function fetchGoals() {
  const { data, error } = await supabase.from('goals').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function insertGoal(goal) {
  const { error } = await supabase.from('goals').insert(goal);
  if (error) throw error;
}

export async function updateGoal(id, patch) {
  const { error } = await supabase.from('goals').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function deleteGoal(id) {
  const { error } = await supabase.from('goals').delete().eq('id', id);
  if (error) throw error;
}
