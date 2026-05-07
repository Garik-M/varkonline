import { useState, useRef, useCallback } from "react";
import { isPrivacyAccepted } from "@/components/PrivacyPolicyModal";

/**
 * Hook that gates an action behind Privacy Policy acceptance.
 *
 * Usage:
 *   const { privacyOpen, closePrivacy, requireAcceptance } = usePrivacyPolicy();
 *
 *   // In JSX:
 *   <PrivacyPolicyModal open={privacyOpen} onClose={closePrivacy} onAccepted={onPrivacyAccepted} />
 *
 *   // Before submitting:
 *   requireAcceptance(() => doSubmit());
 */
export function usePrivacyPolicy() {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const pendingAction = useRef<(() => void) | null>(null);

  /**
   * If the user has already accepted the current policy version, run `action`
   * immediately. Otherwise open the modal and run `action` after acceptance.
   */
  const requireAcceptance = useCallback((action: () => void) => {
    if (isPrivacyAccepted()) {
      action();
    } else {
      pendingAction.current = action;
      setPrivacyOpen(true);
    }
  }, []);

  const closePrivacy = useCallback(() => {
    setPrivacyOpen(false);
    pendingAction.current = null;
  }, []);

  const onPrivacyAccepted = useCallback(() => {
    const action = pendingAction.current;
    pendingAction.current = null;
    setPrivacyOpen(false);
    action?.();
  }, []);

  return { privacyOpen, closePrivacy, onPrivacyAccepted, requireAcceptance };
}
