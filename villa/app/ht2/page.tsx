import { HtApp } from "@/components/ht/HtApp";
import { HtDataProvider } from "@/components/ht/data";
import { HT2_DATA } from "@/lib/ht2/data";

export default function HomeTheaterRoomIndia() {
  return (
    <HtDataProvider data={HT2_DATA}>
      <HtApp />
    </HtDataProvider>
  );
}
