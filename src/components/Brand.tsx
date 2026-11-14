/** Viewport crop only: the supplied original bytes and artwork are unmodified. */
export function Brand({className=''}:{className?:string}) {
  return <svg className={`brand ${className}`} viewBox="160 380 1140 295" role="img" aria-label="Inversis">
    <image href={`${import.meta.env.BASE_URL}brand/inversis-logo-original.png`} width="1448" height="1086"/>
  </svg>;
}
