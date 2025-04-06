import { Router } from "express";
import { ethers } from 'ethers'
import LockABI from './PackageVerification.json'
const contractAddress = process.env.CONTRACT_ADDRESS as string
const provider = new ethers.JsonRpcProvider(process.env.LOCALHOST_URL)
const router = Router()

router.post("/checkData", async (req, res): Promise<any> => {
  try {
    const { privateKey, hashData } = req.body
    if(!privateKey || !hashData) {
      return res.status(400).json({
        ok: false,
        message: "Private key or hashData is required"
      })
    }
    const signer = new ethers.Wallet(privateKey, provider)
    const lockContract = new ethers.Contract(
      contractAddress,
      LockABI.abi,
      signer
    )
    const packageInfo = await lockContract.getPackageInfo(hashData)
    const packageExists = packageInfo && packageInfo[0] !== '' && packageInfo[0] !== '0x0000000000000000000000000000000000000000'
    if(packageExists) {
      return res.json({
        ok: true,
        message: "Package verified successfully"
      })
    } else {
      return res.json({
        ok: false,
        message: "Package not found"
      })
    }
  } catch(error) {
    console.error("Error in checkData:", error)
    return res.status(500).json({
      ok: false,
      message: "Something went wrong",
      // error: error.message
    })
  }
});

router.post("/getData", async (req, res): Promise<any> => {
  try {
    const { privateKey, hashData } = req.body
    if(!privateKey || !hashData) {
      return res.status(400).json({
        ok: false,
        message: "Private key and hashData are required"
      })
    }
    const signer = new ethers.Wallet(privateKey, provider)
    const lockContract = new ethers.Contract(
      contractAddress,
      LockABI.abi,
      signer
    )
    const packageInfo = await lockContract.getPackageInfo(hashData)
    console.log("Raw package info:", packageInfo)
    if(!packageInfo || packageInfo[0] === '' || packageInfo[0] === '0x0000000000000000000000000000000000000000') {
      return res.json({
        ok: false,
        message: "No package data found"
      })
    }
    return res.json({
      ok: true,
      data: {
        senderID: packageInfo[0],
        recipientID: packageInfo[1],
        aidType: packageInfo[2],
        timestamp: packageInfo[3].toString(),
      }
    })
  } catch(error) {
    console.error("Error in getData:", error)
    return res.status(500).json({
      ok: false,
      message: "Something went wrong",
      // error: error.message
    })
  }
});

router.post("/storeData", async (req, res): Promise<any> => {
  try {
    const { privateKey, senderID, recipientID, aidType, location } = req.body;
    if(!privateKey || !senderID || !recipientID || !aidType || !location) {
      return res.status(400).json({
        ok: false,
        message: "Missing required fields: privateKey, senderID, recipientID, aidType, and location are all required",
      });
    }
    const signer = new ethers.Wallet(privateKey, provider)
    const lockContract = new ethers.Contract(
      contractAddress,
      LockABI.abi,
      signer
    )
    const data = {
      location,
      timestamp: Date.now()
    }
    const hashData = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(data)))
    try {
      const tx = await lockContract.storePackage(senderID, recipientID, aidType, hashData)
      const receipt = await tx.wait()
      console.log("Transaction receipt:", receipt)
      return res.status(201).json({
        ok: true,
        message: "Package data saved successfully",
        data: {
          hashData: hashData,
          txHash: tx.hash,
          contractAddress: tx.to,
          sender: tx.from
        },
      });
    } catch(error) {
      console.error("Contract error:", error)
      return res.status(400).json({
        ok: false,
        message: "Failed to store package data",
        // error: error.message
      })
    }
  } catch(error) {
    console.error("Server error:", error)
    return res.status(500).json({
      ok: false,
      message: "Internal server error",
      // error: error.message
    });
  }
});

export default router