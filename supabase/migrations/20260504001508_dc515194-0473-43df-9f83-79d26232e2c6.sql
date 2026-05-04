INSERT INTO public.website_content (section_key, title_vi, title, description_vi, description, is_active, order_index)
VALUES ('floating_chat', 'Chat Messenger', 'Chat Messenger', 'https://m.me/your-page', 'https://m.me/your-page', true, 999)
ON CONFLICT DO NOTHING;