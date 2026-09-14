interface EndingScreenProps {
  onGoToNanikiru: () => void;
}

export function EndingScreen({ onGoToNanikiru }: EndingScreenProps) {
  return (
    <section style={{ padding: 24, maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
      <h1>입문 미션 완주!</h1>
      <p>
        패 종류 구분과 순쯔 만들기를 모두 익혔습니다.
        <br />
        이제 배운 규칙을 바탕으로 실력을 훈련하는 <strong>나니키루</strong>로 넘어가볼까요?
      </p>
      <button type="button" onClick={onGoToNanikiru} style={{ marginTop: 16, padding: '10px 20px', fontSize: 16 }}>
        나니키루 시작하기 →
      </button>
    </section>
  );
}
