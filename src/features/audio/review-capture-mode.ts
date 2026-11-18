import type { AppSettings } from '../../shared/domain/types';

type Device = Pick<Navigator, 'userAgent' | 'platform' | 'maxTouchPoints'>;
/** iOS may mask its OS version and iPad may identify as a desktop Mac. */
export function resolveReviewCaptureMode(
  preference: AppSettings['reviewCapture'] = 'auto',
  device: Device | undefined = typeof navigator === 'undefined' ? undefined : navigator,
): 'hold' | 'compatible' {
  if (preference !== 'auto') return preference;
  const ios =
    !!device &&
    (/iPhone|iPad|iPod/i.test(device.userAgent) ||
      (device.platform === 'MacIntel' && device.maxTouchPoints > 1));
  return ios ? 'compatible' : 'hold';
}
