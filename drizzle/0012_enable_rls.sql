-- Migration: Enable Row Level Security on all tables
-- SAFE: This does NOT delete any data. It only restricts access via PostgREST (anon/authenticated roles).
-- The postgres user (table owner) and service_role BYPASS RLS by default.

-- ============================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "credits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "saved_studies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "study_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "credit_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tools" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tool_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "planTools" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "plan_tools" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "chatbot_contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ticket_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "dashboard_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sent_emails" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "marketing_groups" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. GRANT FULL ACCESS TO service_role
-- (Used by supabaseAdmin in the backend)
-- ============================================

-- Users
CREATE POLICY "service_role_all_users" ON "users"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Plans (also allow read for authenticated users — plans are quasi-public)
CREATE POLICY "service_role_all_plans" ON "plans"
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_read_plans" ON "plans"
  FOR SELECT TO authenticated USING (true);

-- Subscriptions
CREATE POLICY "service_role_all_subscriptions" ON "subscriptions"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Credits
CREATE POLICY "service_role_all_credits" ON "credits"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Saved Studies
CREATE POLICY "service_role_all_saved_studies" ON "saved_studies"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Study Messages
CREATE POLICY "service_role_all_study_messages" ON "study_messages"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Credit Transactions
CREATE POLICY "service_role_all_credit_transactions" ON "credit_transactions"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Tools (also allow read for authenticated — tools list is quasi-public)
CREATE POLICY "service_role_all_tools" ON "tools"
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_read_tools" ON "tools"
  FOR SELECT TO authenticated USING (true);

-- Tool Categories
CREATE POLICY "service_role_all_tool_categories" ON "tool_categories"
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_read_tool_categories" ON "tool_categories"
  FOR SELECT TO authenticated USING (true);

-- Plan Tools (camelCase)
CREATE POLICY "service_role_all_planTools" ON "planTools"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Plan Tools (snake_case)
CREATE POLICY "service_role_all_plan_tools" ON "plan_tools"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Chatbot Contacts
CREATE POLICY "service_role_all_chatbot_contacts" ON "chatbot_contacts"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Ticket Messages
CREATE POLICY "service_role_all_ticket_messages" ON "ticket_messages"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Payments
CREATE POLICY "service_role_all_payments" ON "payments"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Dashboard Settings
CREATE POLICY "service_role_all_dashboard_settings" ON "dashboard_settings"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Sent Emails
CREATE POLICY "service_role_all_sent_emails" ON "sent_emails"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Marketing Groups
CREATE POLICY "service_role_all_marketing_groups" ON "marketing_groups"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- 3. VERIFICATION QUERY (run after migration)
-- ============================================
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename;
