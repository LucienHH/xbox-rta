export enum MessageType {
  Subscribe = 1,
  Unsubscribe,
  Event,
  Resync,
}

export enum StatusCode {
  Success = 0,
  UnknownResource = 1,
  SubscriptionLimitReached = 2,
  NoResourceData = 3,
  Throttled = 1001,
  ServiceUnavailable = 1002
}

export const convertRTAStatus = (status: number) => {
  switch (status) {
    case StatusCode.Success:
      return 'Success'
    case StatusCode.UnknownResource:
      return 'UnknownResource'
    case StatusCode.SubscriptionLimitReached:
      return 'SubscriptionLimitReached'
    case StatusCode.NoResourceData:
      return 'NoResourceData'
    case StatusCode.Throttled:
      return 'Throttled'
    case StatusCode.ServiceUnavailable:
      return 'ServiceUnavailable'
    default:
      return 'Unknown'
  }
}
