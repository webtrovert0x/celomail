export async function uploadToIPFS(content: string): Promise<string> {
  const jwt = process.env.NEXT_PUBLIC_PINATA_JWT;
  
  if (!jwt || jwt === 'YOUR_PINATA_JWT_HERE') {
    throw new Error("Pinata JWT is not configured in .env.local");
  }

  try {
    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwt}`
      },
      body: JSON.stringify({
        pinataContent: {
          encryptedEmail: content
        },
        pinataMetadata: {
          name: "mailora-message.json"
        }
      })
    });

    const data = await response.json();
    if (data.IpfsHash) {
      return data.IpfsHash; // This is the CID
    } else {
      throw new Error(data.error?.details || "Failed to upload to IPFS");
    }
  } catch (error) {
    console.error("IPFS Upload Error:", error);
    throw error;
  }
}

export async function fetchFromIPFS(cid: string): Promise<string> {
  try {
    // We use a public gateway for retrieval. (You can also use a dedicated Pinata Gateway)
    const response = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
    const data = await response.json();
    return data.encryptedEmail;
  } catch (error) {
    console.error("IPFS Fetch Error:", error);
    throw error;
  }
}

export async function uploadFileToIPFS(file: File): Promise<string> {
  const jwt = process.env.NEXT_PUBLIC_PINATA_JWT;
  
  if (!jwt || jwt === 'YOUR_PINATA_JWT_HERE') {
    throw new Error("Pinata JWT is not configured in .env.local");
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const pinataMetadata = JSON.stringify({
      name: file.name
    });
    formData.append('pinataMetadata', pinataMetadata);

    const pinataOptions = JSON.stringify({
      cidVersion: 0,
    });
    formData.append('pinataOptions', pinataOptions);

    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${jwt}`
      },
      body: formData
    });

    const data = await response.json();
    if (data.IpfsHash) {
      return data.IpfsHash;
    } else {
      throw new Error(data.error?.details || "Failed to upload file to IPFS");
    }
  } catch (error) {
    console.error("IPFS File Upload Error:", error);
    throw error;
  }
}
