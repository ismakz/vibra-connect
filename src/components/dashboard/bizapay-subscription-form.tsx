"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";

import { ImageUploadField } from "@/components/upload/image-upload-field";
import { selectFormDense } from "@/lib/select-classes";

type PlanKey = "FREE" | "STANDARD" | "PREMIUM" | "SPONSORED";
type Method = "AIRTEL_MONEY_RDC" | "MTN_MOMO_RWANDA" | "MANUAL";

export function BizapaySubscriptionForm({
  prices,
  officialAccounts,
  imageUploadConfigured,
}: {
  prices: Record<PlanKey, number>;
  officialAccounts: {
    mtnMomoRwandaNumber: string;
    mtnMomoRwandaCountry: string;
    mtnMomoRwandaCurrency: string;
    mtnMomoRwandaEnabled: boolean;
    airtelMoneyRdcNumber: string;
    airtelMoneyRdcCountry: string;
    airtelMoneyRdcCurrency: string;
    airtelMoneyRdcEnabled: boolean;
  };
  imageUploadConfigured: boolean;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState<PlanKey>("STANDARD");
  const [paymentMethod, setPaymentMethod] = useState<Method>(
    officialAccounts.airtelMoneyRdcEnabled ? "AIRTEL_MONEY_RDC" : "MANUAL",
  );
  const [payerPhoneNumber, setPayerPhoneNumber] = useState("");
  const [reference, setReference] = useState("");
  const [proofImageUrl, setProofImageUrl] = useState("");
  const [status, setStatus] = useState<{ type: "idle" | "ok" | "error"; message: string }>({
    type: "idle",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState<{ type: "idle" | "ok" | "error"; message: string }>({
    type: "idle",
    message: "",
  });

  const amount = useMemo(() => prices[plan], [plan, prices]);

  function paymentMethodLabel(method: Method) {
    if (method === "MTN_MOMO_RWANDA") return "MTN MoMo Rwanda";
    if (method === "AIRTEL_MONEY_RDC") return "Airtel Money RDC";
    return "Paiement manuel";
  }

  function officialNumberForMethod(method: Method) {
    if (method === "MTN_MOMO_RWANDA") return officialAccounts.mtnMomoRwandaNumber;
    if (method === "AIRTEL_MONEY_RDC") return officialAccounts.airtelMoneyRdcNumber;
    return "";
  }

  async function copyText(text: string, successMessage = "Numéro copié") {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus({ type: "ok", message: successMessage });
    } catch {
      setCopyStatus({ type: "error", message: "Impossible de copier, copiez manuellement" });
    }
  }

  async function copyInstructions() {
    const number = officialNumberForMethod(paymentMethod);
    const payload = [
      `Méthode: ${paymentMethodLabel(paymentMethod)}`,
      `Numéro officiel: ${number || "N/A"}`,
      `Montant: ${amount.toLocaleString("fr-FR")} USD`,
      "Après paiement, renseignez la référence de transaction dans VIBRA CONNECT.",
    ].join("\n");
    await copyText(payload, "Instructions copiées");
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "idle", message: "" });
    try {
      const res = await fetch("/api/dashboard/business/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          paymentMethod,
          payerPhoneNumber,
          reference,
          proofImageUrl,
          amount,
        }),
      });
      const result = (await res.json()) as { ok?: boolean; message?: string; error?: string };
      if (!res.ok || !result.ok) {
        setStatus({ type: "error", message: result.error ?? "Échec de la demande Bizapay." });
      } else {
        setStatus({ type: "ok", message: result.message ?? "Demande envoyée." });
        setReference("");
        setProofImageUrl("");
        router.refresh();
      }
    } catch {
      setStatus({ type: "error", message: "Erreur réseau. Réessayez." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="rounded-xl border border-amber-400/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
        Envoyez le paiement uniquement aux numéros officiels affichés ici.
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-cyan-400/25 bg-cyan-500/10 p-3 text-xs">
          <p className="font-semibold text-cyan-100">MTN MoMo Rwanda</p>
          <p className="mt-1 text-white/85">{officialAccounts.mtnMomoRwandaNumber}</p>
          <p className="text-white/70">
            {officialAccounts.mtnMomoRwandaCountry} · {officialAccounts.mtnMomoRwandaCurrency}
          </p>
          <button
            type="button"
            onClick={() => copyText(officialAccounts.mtnMomoRwandaNumber)}
            className="mt-3 inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white hover:border-cyan-300/40"
          >
            <Copy className="h-3 w-3" />
            Copier le numéro
          </button>
        </div>
        <div className="rounded-xl border border-cyan-400/25 bg-cyan-500/10 p-3 text-xs">
          <p className="font-semibold text-cyan-100">Airtel Money RDC</p>
          <p className="mt-1 text-white/85">{officialAccounts.airtelMoneyRdcNumber}</p>
          <p className="text-white/70">
            {officialAccounts.airtelMoneyRdcCountry} · {officialAccounts.airtelMoneyRdcCurrency}
          </p>
          <button
            type="button"
            onClick={() => copyText(officialAccounts.airtelMoneyRdcNumber)}
            className="mt-3 inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white hover:border-cyan-300/40"
          >
            <Copy className="h-3 w-3" />
            Copier le numéro
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="text-white/75">Plan marketplace</span>
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value as PlanKey)}
            className={selectFormDense}
          >
            <option value="FREE">Free</option>
            <option value="STANDARD">Standard</option>
            <option value="PREMIUM">Premium</option>
            <option value="SPONSORED">Sponsored</option>
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-white/75">Méthode de paiement</span>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as Method)}
            className={selectFormDense}
          >
            {officialAccounts.airtelMoneyRdcEnabled && <option value="AIRTEL_MONEY_RDC">Airtel Money RDC</option>}
            {officialAccounts.mtnMomoRwandaEnabled && <option value="MTN_MOMO_RWANDA">MTN MoMo Rwanda</option>}
            <option value="MANUAL">Paiement manuel</option>
          </select>
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="text-white/75">Numéro expéditeur</span>
          <input
            value={payerPhoneNumber}
            onChange={(e) => setPayerPhoneNumber(e.target.value)}
            required
            className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2"
            placeholder="+243..."
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-white/75">Référence transaction</span>
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            required
            className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2"
            placeholder="TXN-..."
          />
        </label>
      </div>

      <label className="space-y-1 text-sm">
        <span className="text-white/75">Capture (URL optionnelle)</span>
        <ImageUploadField
          purpose="bizapay-proof"
          label="Preuve de paiement (image)"
          value={proofImageUrl}
          onChange={setProofImageUrl}
          imageUploadConfigured={imageUploadConfigured}
          disabled={loading}
          className="mb-2"
        />
        <input
          value={proofImageUrl}
          onChange={(e) => setProofImageUrl(e.target.value)}
          className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2"
          placeholder="https://..."
        />
      </label>

      <div className="rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-sm">
        Montant à payer: <span className="font-semibold text-cyan-200">{amount.toLocaleString("fr-FR")} USD</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copyInstructions}
          className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:border-cyan-300/40"
        >
          <Copy className="h-3 w-3" />
          Copier les instructions
        </button>
      </div>

      {copyStatus.type !== "idle" && (
        <p
          className={[
            "rounded-xl border px-3 py-2 text-sm",
            copyStatus.type === "ok"
              ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-100"
              : "border-red-500/35 bg-red-500/10 text-red-100",
          ].join(" ")}
        >
          {copyStatus.message}
        </p>
      )}

      {status.type === "error" && (
        <p className="rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-100">{status.message}</p>
      )}
      {status.type === "ok" && (
        <p className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
          {status.message}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-2 text-sm font-semibold text-black disabled:opacity-50"
      >
        {loading ? "Envoi..." : "Envoyer la demande Bizapay"}
      </button>
    </form>
  );
}
