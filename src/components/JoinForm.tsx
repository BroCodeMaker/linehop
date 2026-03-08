export default function JoinForm({ slug }: { slug: string }) {
  return (
    <form>
      <input name="partySize" placeholder="Party size" />
      <input name="phone" placeholder="Phone" />
      <input name="guestName" placeholder="Optional name" />
      <button type="submit">Join</button>
      <p>Restaurant slug: {slug}</p>
    </form>
  );
}
