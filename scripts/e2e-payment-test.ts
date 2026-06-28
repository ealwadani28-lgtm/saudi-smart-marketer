import fs from "fs";
import { submitPaymentProof } from "@/lib/payment-verify.functions";

const REQUEST_ID = process.env.REQ_ID!;
const EMAIL = process.env.EMAIL!;
const buf = fs.readFileSync("/tmp/test-receipt.jpg");
const base64 = buf.toString("base64");

const result = await submitPaymentProof({
  data: {
    subscriptionRequestId: REQUEST_ID,
    email: EMAIL,
    fileName: "receipt.jpg",
    mimeType: "image/jpeg",
    base64,
  },
});
console.log(JSON.stringify(result, null, 2));
