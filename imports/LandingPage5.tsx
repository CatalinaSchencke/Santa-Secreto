import Image from 'next/image';

// Using public image path
const imgVectorrr1 = "/images/gift.png";

function Container() {
  return (
    <div className="content-stretch flex flex-col gap-[18px] items-start relative shrink-0 w-[614px]" data-name="Container">
      <p className="font-raleway font-medium relative text-lg text-white w-[614px] whitespace-pre-wrap">
        <span>{`No adivines, `}</span>
        <span className="font-raleway font-bold">{`conoce `}</span>
        <span>{` exactamente qué `}</span>
        <span className="font-raleway font-bold">quiere</span>
        <span>{` tu Santa Secreto.`}</span>
      </p>
    </div>
  );
}

function Container1() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[32px] items-start left-[127px] top-[393px] w-[614px]" data-name="Container">
      <Container />
    </div>
  );
}

// function Container2() {
//   return <div className="h-[63px] shrink-0" data-name="Container" />;
// }

// function Container3() {
//   return (
//     <div className="absolute content-stretch flex flex-col gap-[32px] items-start left-[257px] top-[91px] w-[614px]" data-name="Container">
//       <Container2 />
//     </div>
//   );
// }

function SmallButton() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[15px] items-center justify-center px-[48px] py-[18px] relative rounded-[109.5px] shrink-0" data-name="Small button">
      <p className="font-raleway font-extrabold leading-[42px] relative shrink-0 text-[#ce3b46] text-[24px] text-center text-nowrap whitespace-pre">Ver mi amigo secreto</p>
    </div>
  );
}

function SmallButton1() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[15px] items-center justify-center px-[48px] py-[18px] relative rounded-[109.5px] shrink-0" data-name="Small button">
      <p className="font-raleway font-extrabold leading-[42px] relative shrink-0 text-[#ce3b46] text-[24px] text-center text-nowrap whitespace-pre">Ver lista de regalos</p>
    </div>
  );
}

function Frame() {
  return (
    <div className="absolute content-stretch flex gap- items-start left-[377px] top-[197px]">
      <SmallButton />
      <SmallButton1 />
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-[#ce3b46] size-full" data-name="Landing Page 5">
      <h2 className="text-2xl text-white font-semibold mx-auto max-w-1/2">Bienvenida Familia Perez Rojel</h2>
      <div className="w-full h-auto" data-name="Vectorrr 1">
              <Image alt="" className="w-full object-center object-cover pointer-events-none" src={imgVectorrr1} />
            </div>
      <div className="flex gap-6">
        <Container1 />
        {/* <Container3 /> */}
      </div>
      <p className="absolute font-raleway font-medium leading-[1.26] left-[514px] text-[20px] text-white top-[751px] w-[468px]">Este sitio fue hecho con mucho amor por Catalina.</p>
      <div className="absolute h-[908px] left-[496px] top-[-46px] w-[944px]" />
      <Frame />
    </div>
  );
}