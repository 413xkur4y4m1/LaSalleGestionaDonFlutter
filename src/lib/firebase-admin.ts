// File: src/lib/firebase-admin.ts
import * as admin from "firebase-admin";
import { ServiceAccount } from "firebase-admin";

// Hardcode account
const serviceAccount: ServiceAccount = {
  projectId: "bdsql-9416f",
  clientEmail: "firebase-adminsdk-fbsvc@bdsql-9416f.iam.gserviceaccount.com",
  privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC/r88klYA4rKeB
w3iFmQ7FScjpO5BciLSuiIqr8DbV5Z85pR1hrDQH4QwVxqSkcBrTNPdK3s1J9Fvo
wfjX+UxKrfl84Zz/oGmbsaLdugrcQvM3pIzvfkrhcw2IMXiMs4GTglMOpkaGEpMi
hfy5CAwH71/i38e9HxLauiYNhEUwPM1K/ciaKkpAMOzIzHchZwd39085++Yd5RYz
7ClPLS9bz+pW0pqh76TnvaSxAoGnmIpy4uGtbFmzqVy/Zyup54kGiV38iQkyYA/p
PPcKJU11nXUJVC85TRo5m/tjcHuKg3shpUjvVvuvLT9weTl9ggyuTOpzrTCkuZOO
u1A7TcFXAgMBAAECggEAHcnL9oL3HJeUJmHCknxhI76eJsSXYBHshiz449ReKSpY
bqRepwWURl8uOhoXDujO+mCCR5PNMj9zov211pZKyVY07be/5qe+ka/uv+c/9c+/
rTd4oWUubM+s3CvX8IGa0toPXzjuv7oWPGi3B+gcuoT0ETU2fIjeLLh93l7eQ6sC
TfT9fMx6LpQ0GXftFTU8pRT2MoRdSJcfDpBwE1OCgPJUx3tQ7BbQnD33QACLKzbJ
y/uY3ohvZaGbu/eDILGl3Zyxl3KPdg9yBINgDMWigicmQb3n2etz8TNhtfUk77o9
MTsNp6vz0N09VkL1OtMKV2MHsMhyjH42XkQqFezZjQKBgQDn7Qsb5zF0ivPZ5+lG
yjJlQrEG1NnPFfUd4eID54Q7eedqyG+sksAChghy4CHxaxEvjxXP7Qr1qsHx0XWG
dh0g14SSFMn/tpO6c7kcVavZ9ne/03Ku3/qTDkFiyr8D4XoLwiEyxODxTx8SzG8J
SLImEYXou85fdRuGMBc+Q++y7QKBgQDTlX3a97hy5WCZbazEgLj9/2Rwcz7gP2pa
yXl/AkvDrBh9f+5DMrkGIiYejMAolKhO8X2KwQn0xH7d7QUvtdnm5saURnSsfTIS
Hr9Zpt7+l+cLpOdONN3/+GHMwhikSvw3JORfsj6Ndx3RDo9MJpQFq4kbVjZvB86+
nk9nCaFo0wKBgQDb6HKZIY1OIRb47iHOApjoVOVAQgDIj9xcWjsRUquaLYuVP7pL
2tX/TpGiQw1MOSYRf03CWtQCfsfo/5+9QC98XX4ReW7TbY4DxAioaj9Jq55+IANk
93FDkMfE4dNe3aP4lDkgR3e2tzwSeg9qsShiWkkrlTAoaQURJnZTjt0wPQKBgQCl
9L9+nIbkN94I+ellR8HSGBvjx8EtixAUnaraYCalF7st1MZBluthUC+uDqA6ND+/
i9L4nmj8v5Ly5xIGVhDP93sSmiCxmpFHfS6BV03ZS7RBgdqbkQP/3gZ34FYLp3Uk
m581IE3IEAInE9B53liECgPEmV6gv/L9uJZ3LyqXWQKBgAhFLxJy3ijk4nXj8WJQ
tEyy3SVFVPDeKAnhSkD+x/jFI3iyffOf90ur7msA1BtIV19lmBqaP7GAcNhrqSpw
fvbHdbHEZKhzpULMbPb3Y+QS4ckQPNOAxMy9+vFNs5AGCeb0+bTTA4DvNo80aMj8
dmJC9opEer5lqw9ICaJB8Tgj
-----END PRIVATE KEY-----\n`,
};

// Inicializar Firebase Admin una sola vez
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Exportar servicios
export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
