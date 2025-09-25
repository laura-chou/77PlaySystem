import mongoose, { PipelineStage, Types } from "mongoose";

import { RESPONSE_MESSAGE } from "../common/constants";
import { isNullOrEmpty } from "../common/utils";

import { LogLevel, LogMessage, setLog } from "./logger";

if (isNullOrEmpty(process.env.DBURL)) {
  throw new Error(RESPONSE_MESSAGE.ENV_ERROR);
}

export const connectDB = async(): Promise<void> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await mongoose.connect(process.env.DBURL!);
    setLog(LogLevel.INFO, "MongoDB connected successfully");
  } catch (error) {
    setLog(LogLevel.ERROR, `MongoDB connection error: 
      ${error instanceof Error ? error.message : LogMessage.ERROR.UNKNOWN}`);
    process.exit(1);
  }
};

export const toObjectId = (idStr: string): Types.ObjectId => {
  return new Types.ObjectId(idStr);
};

const dateToString = (dateField: object | string): object => ({
  $dateToString: {
    format: "%Y/%m/%d",
    date: dateField,
    timezone: "+08:00"
  }
});

const sortArray = (input: string, sortBy: object): object => ({
  $sortArray: {
    input,
    sortBy
  }
});

const lookupTransaction = {
  $lookup: {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    from: process.env.COLLECTION_TRANSACTION!,
    localField: "_id",
    foreignField: "customerId",
    as: "transactions"
  }
};

const lookupServiceType = {
  $lookup: {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    from: process.env.COLLECTION_SERVICETYPE!,
    localField: "transactions.serviceTypeId",
    foreignField: "_id",
    as: "serviceTypes"
  }
};

export const getCustomerListPipeline = (): PipelineStage[] => [
  lookupTransaction,
  {
    $project: {
      custId: "$_id",
      _id: 0,
      custName: 1,
      expiryDate: {
        $let: {
          vars: {
            sortedTx: sortArray("$transactions", { spendDate: -1 })
          },
          in: dateToString({ $arrayElemAt: ["$$sortedTx.expiryDate", 0] }),
        }
      }
    }
  },
  {
    $sort: {
      expiryDate: -1
    }
  }
];

export const getCustomerDetailPipeline = (custId: string): PipelineStage[] => [
  { $match: { _id: toObjectId(custId) } },
  lookupTransaction,
  { $unwind: "$transactions" },
  lookupServiceType,
  { $unwind: "$serviceTypes" },
  {
    $group: {
      _id: "$_id",
      custName: { $first: "$custName" },
      extendedTimes: { $first: "$extendedTimes" },
      createDate:  { $first: dateToString("$createDate") },
      history: {
        $push: {
          serviceName: "$serviceTypes.serviceName",
          amount: "$transactions.amount",
          currentBalance: "$transactions.currentBalance",
          spendDate: "$transactions.spendDate",
          expiryDate: "$transactions.expiryDate"
        }
      }
    }
  },
  {
    $addFields: {
      history: sortArray("$history", { spendDate: -1 })
    }
  },
  {
    $set: {
      history: {
        $map: {
          input: "$history",
          as: "item",
          in: {
            serviceName: "$$item.serviceName",
            amount: "$$item.amount",
            currentBalance: "$$item.currentBalance",
            spendDate: dateToString("$$item.spendDate"),
            expiryDate: dateToString("$$item.expiryDate")
          }
        }
      }
    }
  },
  {
    $project: {
      custId: "$_id",
      _id: 0,
      custName: 1,
      extendedTimes: 1,
      createDate: 1,
      history: 1
    }
  }
];