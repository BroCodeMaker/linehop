export default function StatusCard({ publicToken }: { publicToken: string }) {
  return (
    <section>
      <p>Token: {publicToken}</p>
      <p>Status: WAITING</p>
      <p>Position: 0</p>
      <p>ETA: 0 min</p>
    </section>
  );
}
