import { AccountType } from "@pythnetwork/client";
import { PublicKey } from "@solana/web3.js";
import { BN } from "bn.js";
import { AccountsType, PythAccountInfo } from "../../types";

export const accountInfo: PythAccountInfo = {
    "name": "3wDLxH34Yz8tGjwHszQ2MfzHwRoaQgKA32uq2bRpjJBW",
    "programId": "FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH",
    "address": "3wDLxH34Yz8tGjwHszQ2MfzHwRoaQgKA32uq2bRpjJBW",
    "type": AccountsType.PriceAccount,
    "data": {
        "priceAccountKey": new PublicKey("3wDLxH34Yz8tGjwHszQ2MfzHwRoaQgKA32uq2bRpjJBW"),
        "product": {
            "symbol": "Crypto.AAVE/USD",
            "asset_type": "Crypto",
            "quote_currency": "USD",
            "tenor": '',
            "price_account": "3wDLxH34Yz8tGjwHszQ2MfzHwRoaQgKA32uq2bRpjJBW",
            "index": ''
        },
        "priceType": 1,
        "exponent": -8,
        "numComponentPrices": 17,
        "numQuoters": 10,
        "lastSlot": new BN("171918812"),
        "validSlot": new BN("171918811"),
        "emaPrice": {
            "valueComponent": new BN("6151820600"),
            "value": 61.518206,
            "numerator": new BN("2873537695"),
            "denominator": new BN("4671036157")
        },
        "emaConfidence": {
            "valueComponent": new BN("4811972"),
            "value": 0.04811972,
            "numerator": new BN("2247689724"),
            "denominator": new BN("4671036157")
        },
        "magic": 0,
        "version": 3,
        "type": AccountType.Price,
        "size": 0,
        "timestamp": new BN(1673432942),
        "minPublishers": 3,
        "drv2": 0,
        "drv3": 0,
        "drv4": 0,
        "productAccountKey": new PublicKey("CXgrYNWxT8n63YQ7mMC33Pgr8td5SZRSp3JGqmXna2VJ"),
        "nextPriceAccountKey": null,
        "previousSlot": new BN("171918811"),
        "previousPriceComponent": new BN("6144719041"),
        "previousPrice": 61.447190410000005,
        "previousConfidenceComponent": new BN("3280959"),
        "previousConfidence": 0.03280959,
        "previousTimestamp": new BN("1673432941"),
        "priceComponents": [
            {
                "publisher": new PublicKey("2ehFijXkacypZL4jdfPm38BJnMKsN2nMHm8xekbujjdx"),
                "aggregate": {
                    "price": 61.45,
                    "priceComponent": new BN("6145000000"),
                    "confidenceComponent": new BN("10000000"),
                    "confidence": 0.1,
                    "status": 1,
                    "corporateAction": 0,
                    "publishSlot": 171918795
                },
                "latest": {
                "price": 61.45,
                "priceComponent": new BN("6145000000"),
                "confidenceComponent": new BN("10000000"),
                "confidence": 0.1,
                "status": 1,
                "corporateAction": 0,
                "publishSlot": 171918806
                }
            },
        ],
        "aggregate": {
            "price": 61.447190410000005,
            "priceComponent": new BN("6144719041"),
            "confidenceComponent": new BN("3280959"),
            "confidence": 0.03280959,
            "status": 1,
            "corporateAction": 0,
            "publishSlot": 171918812
        },
        "price": undefined,
        "confidence": undefined,
        "status": 0
    }
}