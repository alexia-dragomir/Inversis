/** Deterministic transparency derivative; the supplied original remains retained. */
export function Brand({className=''}:{className?:string}) {
  return <img className={`brand ${className}`} src={`${import.meta.env.BASE_URL}brand/inversis-logo-transparent.png`} width="1122" height="281" alt="Inversis"/>;
}
