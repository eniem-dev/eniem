"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { subscribeAction } from "../actions/subscribe.action";
import { locales } from "@/locales";
import { motion } from "framer-motion";
import { Mail, CheckCircle } from "lucide-react";
import { captureEvent } from "@/lib/tracking";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const { execute, isExecuting } = useAction(subscribeAction, {
    onSuccess: ({ data }) => {
      captureEvent("email_submitted", { email });
      toast.success(data.message);
      setIsSuccess(true);
      setTimeout(() => {
        setEmail("");
        setIsSuccess(false);
      }, 3000);
    },
    onError: ({ error }) => toast.error(error.serverError || locales.errors.serverError),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    execute({ email });
  };

  const isDisabled = isExecuting || !email.trim();

  if (isSuccess) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center justify-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 max-w-md mx-auto"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
        </motion.div>
        <span className="text-green-700 dark:text-green-300 font-medium">
          {locales.LandingPage.newsletter.success}
        </span>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="relative max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative flex gap-2 p-2 rounded-2xl bg-background/50 backdrop-blur-sm border border-border/50 focus-within:border-primary/50 transition-all duration-300">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="email"
            placeholder={locales.LandingPage.newsletter.placeholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isExecuting}
            required
            className="pl-10 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-12"
          />
        </div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            type="submit"
            disabled={isDisabled}
            loading={isExecuting}
            size="lg"
            className="px-6 rounded-xl h-12"
          >
            {locales.LandingPage.newsletter.submitButton}
          </Button>
        </motion.div>
      </div>

      {/* Floating animation effect */}
      <motion.div
        className="absolute -top-1 -left-1 -right-1 -bottom-1 rounded-2xl bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20 blur-xl -z-10 pointer-events-none"
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.form>
  );
}
