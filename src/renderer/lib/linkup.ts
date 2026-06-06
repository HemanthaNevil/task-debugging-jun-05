import axios from "axios"

const getBaseUrl = (countryCode: string): string => {
  return `https://api-${countryCode}.libreview.io`
}

// THE FIX: Helper function to hash the User ID exactly as the new API requires
async function getAccountId(userId: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(userId);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

type LoginAttemptRequest = {
  country: string
  username: string
  password: string
}

type GetGeneralRequest = {
  token: string
  country: string
}

export async function getAuthToken(request: LoginAttemptRequest): Promise<string> {
  try {
    const baseUrl = getBaseUrl(request.country);

    // Step 1: Login
    const loginResponse = await axios({
      method: 'post',
      url: `${baseUrl}/llu/auth/login`,
      data: {
        email: request.username,
        password: request.password,
      },
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "product": "llu.android",
        "version": "4.16.0",
      }
    })

    const token = loginResponse.data?.data?.authTicket?.token;
    const userId = loginResponse.data?.data?.user?.id; // Grab the raw User ID

    if (!token) {
        throw new Error("No auth token found.");
    }

    // Step 2: Hash the User ID and store it silently so we don't break the UI
    let accountId = "";
    if (userId) {
        accountId = await getAccountId(userId);
        localStorage.setItem('libreview_account_id', accountId);
    }

    // Step 3: Accept Terms of Use (Including the new header just in case)
    try {
      await axios({
        method: 'post',
        url: `${baseUrl}/auth/continue/tou`,
        headers: {
          "Accept": "application/json, application/xml",
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "product": "llu.android",
          "version": "4.16.0",
          "Account-Id": accountId 
        }
      });
    } catch (touError) {
      console.warn("TOU check: ", touError);
    }

    return token;
  } catch (error) {
    console.error("Authentication Failed: ", error);
    throw error; 
  }
}

export async function getCGMData(request: GetGeneralRequest): Promise<any> {
  if (!request.token) {
      throw new Error("Missing auth token.");
  }

  try {
    const baseUrl = getBaseUrl(request.country);
    // Retrieve the hashed ID we saved during login
    const accountId = localStorage.getItem('libreview_account_id') || "";

    const headers = {
      "Accept": "application/json, application/xml, multipart/form-data",
      "Authorization": `Bearer ${request.token}`,
      "product": "llu.android",
      "version": "4.16.0",
      "Account-Id": accountId // THE FIX: Passing the new required header
    }

    const connResponse = await axios({
      method: 'get',
      url: `${baseUrl}/llu/connections`,
      headers
    })

    const patientId = connResponse.data?.data?.[0]?.patientId

    if (!patientId) {
      throw new Error("No patient ID found.")
    }

    const graphResponse = await axios({
      method: 'get',
      url: `${baseUrl}/llu/connections/${patientId}/graph`,
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${request.token}`,
        "product": "llu.android",
        "version": "4.16.0",
        "Account-Id": accountId
      }
    })

    return graphResponse?.data?.data?.connection
  } catch (error) {
    console.error("Failed to fetch CGM data: ", error)
    throw error;
  }
}

export async function getConnection(request: GetGeneralRequest): Promise<any> {
   if (!request.token) {
      throw new Error("Missing auth token.");
  }

  try {
    const baseUrl = getBaseUrl(request.country);
    const accountId = localStorage.getItem('libreview_account_id') || "";

    const response = await axios({
      method: 'get',
      url: `${baseUrl}/llu/connections`,
      headers: {
        "Accept": "application/json, application/xml, multipart/form-data",
        "Authorization": `Bearer ${request.token}`,
        "product": "llu.android",
        "version": "4.16.0",
        "Account-Id": accountId
      }
    })

    return response?.data?.data?.[0] || null;
  } catch (error) {
    console.error("Failed to fetch connection: ", error)
    throw error;
  }
}