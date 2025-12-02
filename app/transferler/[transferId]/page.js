"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const formatDateTime = (value) => {
	if (!value) {
		return "-";
	}

	const tarih = new Date(value);
	if (Number.isNaN(tarih.getTime())) {
		return "-";
	}

	return tarih.toLocaleDateString("tr-TR", {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

const formatAmount = (value, unit) => {
	if (value === null || value === undefined) {
		return "-";
	}

	const numberValue = Number(value);
	if (Number.isNaN(numberValue)) {
		return "-";
	}

	const options = {
		maximumFractionDigits: 2,
		minimumFractionDigits: numberValue % 1 === 0 ? 0 : 2,
	};

	const formatted = numberValue.toLocaleString("tr-TR", options);
	return unit ? `${formatted} ${unit}` : formatted;
};

export default function TransferDetailPage() {
	const params = useParams();
	const router = useRouter();
	const { transferId } = params;

	const [transfer, setTransfer] = useState(null);
	const [yukleniyor, setYukleniyor] = useState(true);
	const [hata, setHata] = useState("");

	useEffect(() => {
		if (!transferId) {
			return;
		}

		const fetchTransfer = async () => {
			setYukleniyor(true);
			setHata("");
			try {
				const response = await fetch(`/api/transferler/${transferId}`);
				const data = await response.json();
				if (!response.ok) {
					throw new Error(data?.hata || "Transfer bulunamadı");
				}
				setTransfer(data.transfer);
			} catch (error) {
				console.error("Transfer alınamadı:", error);
				setHata(error.message || "Transfer bilgileri alınırken bir sorun oluştu");
			} finally {
				setYukleniyor(false);
			}
		};

		fetchTransfer();
	}, [transferId]);

	return (
		<div className="min-h-screen bg-gray-100 py-8">
			<div className="container mx-auto px-4">
				<div className="flex items-center justify-between gap-4 mb-6">
					<div className="flex items-center gap-3">
						<button
							onClick={() => router.push("/transferler")}
							className="text-gray-600 hover:text-gray-800"
						>
							← Listeye Dön
						</button>
						<h1 className="text-3xl font-bold text-gray-800">Transfer Detayı</h1>
					</div>
					<div className="flex gap-3">
						<button
							onClick={() => window.open(`/api/transfer-pdf/${transferId}`, "_blank")}
							className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-semibold transition-colors"
						>
							PDF Aç
						</button>
					</div>
				</div>

				{yukleniyor ? (
					<div className="bg-white rounded-lg shadow-lg p-12 text-center text-gray-600">
						Yükleniyor...
					</div>
				) : hata ? (
					<div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-6">
						{hata}
					</div>
				) : !transfer ? (
					<div className="bg-white rounded-lg shadow-lg p-12 text-center text-gray-600">
						Transfer bilgisi bulunamadı.
					</div>
				) : (
					<div className="space-y-6">
						<div className="bg-white rounded-lg shadow-lg p-6">
							<h2 className="text-xl font-semibold text-gray-800 mb-4">Genel Bilgiler</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
								<div className="border border-gray-200 rounded-lg overflow-hidden">
									<table className="w-full">
										<tbody>
											<tr className="bg-gray-50">
												<th className="px-4 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">
													Transfer No
												</th>
												<td className="px-4 py-3 border-b border-gray-200 text-gray-900 font-semibold">
													{transfer.id}
												</td>
											</tr>
											<tr>
												<th className="px-4 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">
													Oluşturulma
												</th>
												<td className="px-4 py-3 border-b border-gray-200 text-gray-600">
													{formatDateTime(transfer.olusturmaTarihi)}
												</td>
											</tr>
											<tr className="bg-gray-50">
												<th className="px-4 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">
													Teslim Eden
												</th>
												<td className="px-4 py-3 border-b border-gray-200 text-gray-600">
													{transfer.teslimEden}
												</td>
											</tr>
											<tr>
												<th className="px-4 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">
													Teslim Alan
												</th>
												<td className="px-4 py-3 border-b border-gray-200 text-gray-600">
													{transfer.teslimAlan}
												</td>
											</tr>
											<tr className="bg-gray-50">
												<th className="px-4 py-3 text-left font-semibold text-gray-700">
													Hedef Konum
												</th>
												<td className="px-4 py-3 text-gray-600">
													{transfer.hedefKonum}
												</td>
											</tr>
										</tbody>
									</table>
								</div>
								<div className="border border-gray-200 rounded-lg overflow-hidden">
									<table className="w-full">
										<tbody>
											<tr className="bg-gray-50">
												<th className="px-4 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">
													Ürün Sayısı
												</th>
												<td className="px-4 py-3 border-b border-gray-200 text-gray-900 font-semibold">
													{Array.isArray(transfer.urunler) ? transfer.urunler.length : 0}
												</td>
											</tr>
											<tr>
												<th className="px-4 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">
													Not
												</th>
												<td className="px-4 py-3 border-b border-gray-200 text-gray-600">
													{transfer.aciklama || "-"}
												</td>
											</tr>
											<tr className="bg-gray-50">
												<th className="px-4 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">
													Oluşturan IP
												</th>
												<td className="px-4 py-3 border-b border-gray-200 text-gray-600">
													{transfer.ipAdresi || "-"}
												</td>
											</tr>
											<tr>
												<th className="px-4 py-3 text-left font-semibold text-gray-700">
													Referans PDF
												</th>
												<td className="px-4 py-3 text-gray-600">
													<button
														type="button"
														onClick={() => window.open(`/api/transfer-pdf/${transfer.id}`, "_blank")}
														className="text-blue-600 hover:underline text-sm font-semibold"
													>
														PDF dosyasını aç
													</button>
												</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>
						</div>

						<div className="bg-white rounded-lg shadow-lg p-6">
							<div className="flex items-center justify-between mb-4">
								<h2 className="text-xl font-semibold text-gray-800">Ürünler</h2>
								<span className="text-sm text-gray-500">
									Toplam {Array.isArray(transfer.urunler) ? transfer.urunler.length : 0} satır listeleniyor
								</span>
							</div>

							{Array.isArray(transfer.urunler) && transfer.urunler.length > 0 ? (
								<div className="overflow-x-auto">
									<table className="min-w-full border-collapse text-sm text-gray-800">
										<thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-600">
											<tr>
												<th className="border-b border-gray-200 px-3 py-3 text-left">#</th>
												<th className="border-b border-gray-200 px-3 py-3 text-left">Ürün Adı</th>
												<th className="border-b border-gray-200 px-3 py-3 text-left">Barkod</th>
												<th className="border-b border-gray-200 px-3 py-3 text-left">Kategori</th>
												<th className="border-b border-gray-200 px-3 py-3 text-right">Gönderilen</th>
												<th className="border-b border-gray-200 px-3 py-3 text-right">Depoda Kalan</th>
												<th className="border-b border-gray-200 px-3 py-3 text-left">Birim</th>
											</tr>
										</thead>
										<tbody>
											{transfer.urunler.map((urun, index) => (
												<tr key={urun.id || `${transfer.id}-${index}`} className={index % 2 === 1 ? "bg-gray-50" : ""}>
													<td className="border-b border-gray-200 px-3 py-3 text-xs text-gray-500">
														{index + 1}
													</td>
													<td className="border-b border-gray-200 px-3 py-3 font-semibold text-gray-900">
														{urun.ad}
													</td>
													<td className="border-b border-gray-200 px-3 py-3 text-gray-600">
														{urun.barkod || "-"}
													</td>
													<td className="border-b border-gray-200 px-3 py-3 text-gray-600">
														{urun.kategori || "-"}
													</td>
													<td className="border-b border-gray-200 px-3 py-3 text-right font-mono text-gray-800">
														{formatAmount(urun.miktar, urun.birim)}
													</td>
													<td className="border-b border-gray-200 px-3 py-3 text-right font-mono text-gray-800">
														{formatAmount(urun.kalanMiktar, urun.birim)}
													</td>
													<td className="border-b border-gray-200 px-3 py-3 text-gray-600">
														{urun.birim || "adet"}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							) : (
								<p className="text-sm text-gray-500">Bu transfere ait ürün kaydı bulunamadı.</p>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}