-- Notify conversation members when a new chat message is sent

CREATE OR REPLACE FUNCTION notify_chat_message()
RETURNS TRIGGER AS $$
DECLARE
  sender_name TEXT;
  conv_name TEXT;
  conv_type TEXT;
  member RECORD;
BEGIN
  -- Get sender name
  SELECT p.full_name INTO sender_name
  FROM public.profiles p WHERE p.id = NEW.sender_id;

  -- Get conversation info
  SELECT c.name, c.type INTO conv_name, conv_type
  FROM public.conversations c WHERE c.id = NEW.conversation_id;

  -- For direct messages, we don't need a conversation name
  -- For groups, use the group name

  FOR member IN
    SELECT cm.user_id
    FROM public.conversation_members cm
    WHERE cm.conversation_id = NEW.conversation_id
      AND cm.user_id != NEW.sender_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      member.user_id,
      'chat_message',
      CASE
        WHEN conv_type = 'direct' THEN COALESCE(sender_name, 'Someone')
        ELSE COALESCE(conv_name, 'Group Chat')
      END,
      CASE
        WHEN conv_type = 'direct' THEN COALESCE(sender_name, 'Someone') || ': ' || LEFT(NEW.content, 100)
        ELSE COALESCE(sender_name, 'Someone') || ' in ' || COALESCE(conv_name, 'group') || ': ' || LEFT(NEW.content, 100)
      END,
      NULL
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_chat_message ON public.messages;
CREATE TRIGGER trg_notify_chat_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION notify_chat_message();
